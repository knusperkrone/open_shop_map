use crate::logging::APP_LOGGING;
use crate::models;
use crate::models::establish_db_connection;
use crate::valiator;
use actix_cors::Cors;
use actix_files;
use actix_web::{guard, middleware, web, App, HttpResponse, HttpServer};
use actix_web_middleware_redirect_https::RedirectHTTPS;
use diesel::PgConnection;
use diesel_geography::types::GeogPoint;
use dotenv::dotenv;
use openssl::ssl::{SslAcceptor, SslFiletype, SslMethod};
use std::env;
use std::fs::File;
use std::sync::{Arc, Mutex};

pub mod dto {
    use super::*;
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    pub struct HealthResp {
        pub healthy: bool,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct ErrorResp {
        pub msg: String,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct ShopDto {
        pub title: String,
        pub url: Option<String>,
        #[serde(rename(serialize = "donationUrl"))]
        pub donation_url: Option<String>,
        pub lon: f64,
        pub lat: f64,
    }

    impl From<models::Shop> for ShopDto {
        fn from(shop: models::Shop) -> Self {
            ShopDto {
                title: shop.title,
                url: shop.url,
                donation_url: shop.donation_url,
                lon: shop.location.x,
                lat: shop.location.y,
            }
        }
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct GetShopResp {
        items: Vec<ShopDto>,
    }

    impl From<Vec<models::Shop>> for GetShopResp {
        fn from(shops: Vec<models::Shop>) -> Self {
            GetShopResp {
                items: shops.into_iter().map(|s| s.into()).collect(),
            }
        }
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct InsertShopReq {
        pub title: String,
        pub url: Option<String>,
        #[serde(rename(deserialize = "donationUrl"))]
        pub donation_url: Option<String>,
        pub lon: f64,
        pub lat: f64,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct GetShopsParams {
        pub lon: f64,
        pub lat: f64,
        pub range: i32,
        pub q: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct SearchReqParams {
        pub q: String,
    }

    impl Into<models::NewShop> for InsertShopReq {
        fn into(self) -> models::NewShop {
            models::NewShop {
                title: self.title,
                url: self.url,
                donation_url: self.donation_url,
                location: GeogPoint {
                    x: self.lon,
                    y: self.lat,
                    srid: None,
                },
            }
        }
    }
}

fn healthy() -> HttpResponse {
    // TODO: TEST DB connection
    HttpResponse::Ok().json(dto::HealthResp { healthy: true })
}

async fn angular_index() -> actix_web::Result<actix_files::NamedFile> {
    info!(APP_LOGGING, "Redirected to Angular SPA");
    let file = actix_files::NamedFile::open("../angular-frontend/dist/index.html")?;
    Ok(file.set_content_type("text/html; charset=UTF-8".parse().unwrap()))
}

fn get_shops(
    conn_mtx: web::Data<Arc<Mutex<PgConnection>>>,
    params: web::Query<dto::GetShopsParams>,
) -> HttpResponse {
    let location = GeogPoint {
        x: params.lon,
        y: params.lat,
        srid: None,
    };

    if let Some(query) = &params.q {
        if query.len() < 2 {
            let empty: Vec<dto::ShopDto> = Vec::new();
            HttpResponse::Ok().json(empty)
        } else {
            let conn = conn_mtx.lock().unwrap();
            match models::search_shops_in_range(&conn, query, location, params.range) {
                Ok(shops) => HttpResponse::Ok().json(dto::GetShopResp::from(shops)),
                Err(e) => HttpResponse::BadRequest().json(dto::ErrorResp {
                    msg: format!("{}", e),
                }),
            }
        }
    } else {
        let conn = conn_mtx.lock().unwrap();
        match models::get_shops_in_range(&conn, location, params.range) {
            Ok(shops) => {
                info!(APP_LOGGING, "Fetched {} shops", shops.len());
                HttpResponse::Ok().json(dto::GetShopResp::from(shops))
            }
            Err(e) => {
                warn!(APP_LOGGING, "Failed fetching shops: {}", e);
                HttpResponse::BadRequest().json(dto::ErrorResp {
                    msg: format!("{}", e),
                })
            }
        }
    }
}

async fn insert_shop(
    conn_mtx: web::Data<Arc<Mutex<PgConnection>>>,
    data: web::Json<dto::InsertShopReq>,
) -> HttpResponse {
    if let Err(msg) = valiator::validate_shop(&data).await {
        warn!(APP_LOGGING, "{}", msg);
        return HttpResponse::BadRequest().json(dto::ErrorResp {
            msg: format!("{}", msg),
        });
    }

    let conn = conn_mtx.lock().unwrap();
    match models::insert_new_shop(&conn, &data.into_inner().into()) {
        Ok(shop) => {
            info!(APP_LOGGING, "Inserted shop: {:?}", shop);
            HttpResponse::Created().json(dto::ShopDto::from(shop))
        }
        Err(e) => {
            warn!(APP_LOGGING, "Failed inserting shop: {}", e);
            HttpResponse::BadRequest().json(dto::ErrorResp {
                msg: format!("{}", e),
            })
        }
    }
}

async fn update_shop(
    conn_mtx: web::Data<Arc<Mutex<PgConnection>>>,
    data: web::Json<dto::InsertShopReq>,
) -> HttpResponse {
    if let Err(msg) = valiator::validate_shop(&data).await {
        warn!(APP_LOGGING, "{}", msg);
        return HttpResponse::BadRequest().json(dto::ErrorResp {
            msg: format!("{}", msg),
        });
    }

    let conn = conn_mtx.lock().unwrap();
    match models::update_shop(&conn, data.into_inner().into()) {
        Ok(shop) => {
            info!(APP_LOGGING, "Update shop: {:?}", shop);
            HttpResponse::Created().json(dto::ShopDto::from(shop))
        }
        Err(e) => {
            warn!(APP_LOGGING, "Failed updating shop: {}", e);
            HttpResponse::BadRequest().json(dto::ErrorResp {
                msg: format!("{}", e),
            })
        }
    }
}

pub async fn dispatch_server() -> Result<(), std::io::Error> {
    // Set up logging
    dotenv().ok();
    env::set_var("RUST_LOG", "actix_web=debug");
    env_logger::init();
    let cert_dir = env::var("CERT_DIR").expect("CERT_DIR must be set");
    let http_port = env::var("HTTP_PORT").expect("HTTP_PORT must be set");
    let https_port = env::var("HTTPS_PORT").expect("HTTPS_PORT must be set");
    // load ssl keys
    let mut ssl_builder = SslAcceptor::mozilla_intermediate(SslMethod::tls()).unwrap();
    let cert_file_opt = File::open(format!("{}/cert.pem", cert_dir));
    let key_file_opt = File::open(format!("{}/key.pem", cert_dir));
    let has_tls = cert_file_opt.is_ok() && key_file_opt.is_ok();
    if has_tls {
        info!(APP_LOGGING, "Tls config provided");
        ssl_builder
            .set_private_key_file(format!("{}/key.pem", cert_dir), SslFiletype::PEM)
            .unwrap();
        ssl_builder
            .set_certificate_chain_file(format!("{}/cert.pem", cert_dir))
            .unwrap();
    } else {
        info!(APP_LOGGING, "No tls config found");
    }

    let conn_mtx = Arc::new(Mutex::new(establish_db_connection().unwrap()));
    let server = HttpServer::new(move || {
        App::new()
            .wrap(Cors::new().finish())
            .app_data(web::Data::new(conn_mtx.clone()))
            .data(web::JsonConfig::default().limit(4096))
            .wrap(middleware::Logger::default())
            .service(actix_files::Files::new(
                "/static",
                "../angular-frontend/dist",
            ))
            .default_service(
                web::resource("").route(web::get().to(angular_index)).route(
                    web::route()
                        .guard(guard::Not(guard::Get()))
                        .to(|| HttpResponse::MethodNotAllowed()),
                ),
            )
            .service(web::resource("api/healthy").route(web::get().to(healthy)))
            .service(
                web::resource("api/shop")
                    .route(web::post().to(insert_shop))
                    .route(web::get().to(get_shops))
                    .route(web::put().to(update_shop)),
            )
    });

    let http_bind = format!("0.0.0.0:{}", http_port.clone());
    let https_bind = format!("0.0.0.0:{}", https_port.clone());
    if has_tls {
        info!(
            APP_LOGGING,
            "Start listening to REST endpoints on {} and https redirect on {}",
            https_bind,
            http_bind
        );
        let redirect_server_fut =
            HttpServer::new(move || App::new().wrap(RedirectHTTPS::default()))
                .bind(http_bind.clone())
                .unwrap()
                .run();
        let server_fut = server.bind_openssl(https_bind, ssl_builder).unwrap().run();

        futures::future::join(redirect_server_fut, server_fut)
            .await
            .1
    } else {
        info!(
            APP_LOGGING,
            "Start listening to REST endpoints on {}", http_bind
        );
        server.bind(http_bind).unwrap().run().await
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use actix_web::dev::Service;
    use actix_web::{test, web, App};

    #[actix_rt::test]
    async fn test_healthy() {
        let conn_mtx = Arc::new(Mutex::new(establish_db_connection().unwrap()));
        let mut app = test::init_service(
            App::new()
                .app_data(web::Data::new(conn_mtx.clone()))
                .service(web::resource("api/healthy").route(web::get().to(healthy))),
        )
        .await;

        let req = test::TestRequest::get().uri("/api/healthy").to_request();
        let resp = app.call(req).await.unwrap();
        assert_eq!(200, resp.status());

        let body = match resp.response().body().as_ref() {
            Some(actix_web::body::Body::Bytes(bytes)) => bytes,
            _ => panic!("Response error"),
        };
        let resp = serde_json::from_slice::<dto::HealthResp>(body).unwrap();
        assert_eq!(true, resp.healthy);
    }

    #[actix_rt::test]
    async fn test_insert_shop() {
        let conn_mtx = Arc::new(Mutex::new(establish_db_connection().unwrap()));
        let mut app = test::init_service(
            App::new()
                .app_data(web::Data::new(conn_mtx.clone()))
                .service(web::resource("api/shop").route(web::post().to(insert_shop))),
        )
        .await;

        let request_json = dto::InsertShopReq {
            title: "title".to_owned(),
            url: Some("http://interface-ag.de".to_owned()),
            donation_url: None,
            lon: 11.0788608,
            lat: 49.456,
        };

        let req = test::TestRequest::post()
            .uri("/api/shop")
            .set_json(&request_json)
            .to_request();
        let resp = app.call(req).await.unwrap();
        assert_eq!(201, resp.status());

        let body = match resp.response().body().as_ref() {
            Some(actix_web::body::Body::Bytes(bytes)) => bytes,
            _ => panic!("Response error"),
        };

        // check panic
        let _ = serde_json::from_slice::<dto::ShopDto>(body).unwrap();
    }

    #[actix_rt::test]
    async fn test_update_shop() {
        let conn_mtx = Arc::new(Mutex::new(establish_db_connection().unwrap()));
        let mut app = test::init_service(
            App::new()
                .app_data(web::Data::new(conn_mtx.clone()))
                .service(
                    web::resource("api/shop")
                        .route(web::post().to(insert_shop))
                        .route(web::put().to(update_shop)),
                ),
        )
        .await;

        let mut json = dto::InsertShopReq {
            title: "title".to_owned(),
            url: Some("http://interface-ag.de".to_owned()),
            donation_url: None,
            lon: 11.0788608,
            lat: 49.456742399999996,
        };

        let mut req = test::TestRequest::post()
            .uri("/api/shop")
            .set_json(&json)
            .to_request();
        let _ = app.call(req).await.unwrap();

        json.url = Some("http://if-lab.de".to_owned());
        req = test::TestRequest::put()
            .uri("/api/shop")
            .set_json(&json)
            .to_request();

        let resp = app.call(req).await.unwrap();
        assert_eq!(201, resp.response().status());
        let body = match resp.response().body().as_ref() {
            Some(actix_web::body::Body::Bytes(bytes)) => bytes,
            _ => panic!("Response error"),
        };

        // check updated
        let shop = serde_json::from_slice::<dto::ShopDto>(body).unwrap();
        assert_eq!(shop.url, json.url);
    }

    #[actix_rt::test]
    async fn test_get_shops() {
        let conn_mtx = Arc::new(Mutex::new(establish_db_connection().unwrap()));
        let mut app = test::init_service(
            App::new()
                .app_data(web::Data::new(conn_mtx.clone()))
                .service(web::resource("api/shop").route(web::get().to(get_shops))),
        )
        .await;

        let req = test::TestRequest::get()
            .uri("/api/shop?lon=11.0788608&lat=49.456742399999996&range=1000")
            .to_request();
        let resp = app.call(req).await.unwrap();
        assert_eq!(200, resp.status());
    }
}
