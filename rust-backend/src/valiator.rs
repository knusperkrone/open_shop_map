use std::string::String;
use trust_dns_resolver::TokioAsyncResolver;
use url::Url;

use crate::rest::dto::InsertShopReq;

pub async fn validate_shop(shop: &InsertShopReq) -> Result<(), String> {
    if shop.url.is_none() && shop.donation_url.is_none() {
        return Err("Failed inserting shop - no urls".to_owned());
    }

    if shop.url.is_some() {
        if let Err(msg) = normalize_url(shop.url.as_ref().unwrap()).await {
            return Err(msg);
        }
    }
    if shop.donation_url.is_some() {
        if let Err(msg) = normalize_url(shop.donation_url.as_ref().unwrap()).await {
            return Err(msg);
        }
    }
    Ok(())
}

async fn normalize_url(url: &String) -> Result<(), String> {
    if let Ok(parsed_url) = Url::parse(url) {
        if parsed_url.cannot_be_a_base() && parsed_url.has_host() {
            return Err("Keine BASE URL".to_owned());
        }
        let host: std::string::String = format!("{}", parsed_url.host().unwrap());
        let resolver = TokioAsyncResolver::tokio_from_system_conf().await.unwrap();
        let resp = resolver.lookup_ip(host.clone()).await;
        if let Ok(_) = resp {
            return Ok(());
        } else {
            return Err("Unregistierte URL!".to_owned());
        }
    }
    return Err("Nicht lesbar!".to_owned());
}

#[cfg(test)]
mod test {
    use super::*;

    #[actix_rt::test]
    async fn test_normalize_url() {
        let result = normalize_url(&"http://www.interface-ag.de".to_owned()).await;
        assert_eq!(true, result.is_ok());
    }

    #[actix_rt::test]
    async fn test_invalid_normalize_url() {
        let result = normalize_url(&"http://www.lol".to_owned()).await;
        assert_eq!(true, result.is_err());
    }

    #[actix_rt::test]
    async fn test_invalid_shop() {
        let result = validate_shop(&InsertShopReq {
            title: "title".to_owned(),
            url: None,
            donation_url: None,
            lon: 0.0,
            lat: 0.0,
        })
        .await;
        assert_eq!(true, result.is_err());
    }

    #[actix_rt::test]
    async fn test_valid_url_shop() {
        let result = validate_shop(&InsertShopReq {
            title: "title".to_owned(),
            url: Some("http://www.interface-ag.de".to_owned()),
            donation_url: None,
            lon: 0.0,
            lat: 0.0,
        })
        .await;
        assert_eq!(true, result.is_ok());
    }

    #[actix_rt::test]
    async fn test_valid_donate_url_shop() {
        let result = validate_shop(&InsertShopReq {
            title: "title".to_owned(),
            url: None,
            donation_url: Some("http://www.interface-ag.de".to_owned()),
            lon: 0.0,
            lat: 0.0,
        })
        .await;
        assert_eq!(true, result.is_ok());
    }
}
