use std::string::String;
use trust_dns_resolver::TokioAsyncResolver;
use url::Url;

pub async fn normalize_url(url: &String) -> Result<(), String> {
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
        let result = normalize_url(&"http://www.google.de".to_owned()).await;
        assert_eq!(true, result.is_ok());
    }

    #[actix_rt::test]
    async fn test_invalid_normalize_url() {
        let result = normalize_url(&"http://www.lol".to_owned()).await;
        assert_eq!(true, result.is_err());
    }
}
