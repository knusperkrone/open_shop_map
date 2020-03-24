use crate::logging::APP_LOGGING;
use crate::models;
use crate::models::establish_db_connection;
use crate::valiator;
use actix_cors::Cors;
use actix_files;
use actix_web::{guard, middleware, web, App, HttpResponse, HttpServer};
use diesel::PgConnection;
use diesel_geography::types::GeogPoint;
use dotenv::dotenv;
use rustls::internal::pemfile::{certs, rsa_private_keys};
use rustls::{NoClientAuth, ServerConfig};
use std::env;
use std::fs::File;
use std::io::BufReader;
use std::sync::{Arc, Mutex};

mod dto {
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
        pub url: String,
        pub descr: String,
        pub lon: f64,
        pub lat: f64,
    }

    impl From<models::Shop> for ShopDto {
        fn from(shop: models::Shop) -> Self {
            ShopDto {
                title: shop.title,
                url: shop.url,
                descr: shop.descr,
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
        pub url: String,
        pub descr: String,
        pub lon: f64,
        pub lat: f64,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct GetShopsParams {
        pub lon: f64,
        pub lat: f64,
        pub range: i32,
    }

    impl Into<models::NewShop> for InsertShopReq {
        fn into(self) -> models::NewShop {
            models::NewShop {
                title: self.title,
                url: self.url,
                descr: self.descr,
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
    let conn = conn_mtx.lock().unwrap();
    let location = GeogPoint {
        x: params.lon,
        y: params.lat,
        srid: None,
    };

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

async fn insert_shop(
    conn_mtx: web::Data<Arc<Mutex<PgConnection>>>,
    data: web::Json<dto::InsertShopReq>,
) -> HttpResponse {
    let conn = conn_mtx.lock().unwrap();
    let url_result = valiator::normalize_url(&data.url).await;
    if let Err(msg) = url_result {
        warn!(APP_LOGGING, "{}", msg);
        return HttpResponse::BadRequest().json(dto::ErrorResp {
            msg: format!("{}", msg),
        });
    }

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
    let conn = conn_mtx.lock().unwrap();
    let url_result = valiator::normalize_url(&data.url).await;
    if let Err(msg) = url_result {
        warn!(APP_LOGGING, "{}", msg);
        return HttpResponse::BadRequest().json(dto::ErrorResp {
            msg: format!("{}", msg),
        });
    }

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

pub async fn dispatch_server() {
    // Set up logging
    dotenv().ok();
    let bind = env::var("BIND").expect("ACTIX_WEB_BIND must be set");
    info!(APP_LOGGING, "Start listening to REST endpoints on {}", bind);
    env::set_var("RUST_LOG", "actix_web=debug");
    env_logger::init();
    let conn_mtx = Arc::new(Mutex::new(establish_db_connection()));

    // load ssl keys
    let mut config = ServerConfig::new(NoClientAuth::new());
    let cert_file_opt = File::open("certs/cert.pem");
    let key_file_opt = File::open("certs/key.pem");
    if cert_file_opt.is_ok() && key_file_opt.is_ok() {
        info!(APP_LOGGING, "Activating tls");
        let cert_file = &mut BufReader::new(cert_file_opt.unwrap());
        let key_file = &mut BufReader::new(key_file_opt.unwrap());
        let cert_chain = certs(cert_file).unwrap();
        let mut keys = rsa_private_keys(key_file).unwrap();
        config.set_single_cert(cert_chain, keys.remove(0)).unwrap();
    } else {
        info!(APP_LOGGING, "No tls config found");
    }

    HttpServer::new(move || {
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
    })
    .bind(bind)
    .unwrap()
    .run()
    .await
    .unwrap();
}

#[cfg(test)]
mod test {
    use super::*;
    use actix_web::dev::Service;
    use actix_web::{test, web, App};

    #[actix_rt::test]
    async fn test_healthy() {
        let conn_mtx = Arc::new(Mutex::new(establish_db_connection()));
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
        let conn_mtx = Arc::new(Mutex::new(establish_db_connection()));
        let mut app = test::init_service(
            App::new()
                .app_data(web::Data::new(conn_mtx.clone()))
                .service(web::resource("api/shop").route(web::post().to(insert_shop))),
        )
        .await;

        let request_json = dto::InsertShopReq {
            title: "title".to_owned(),
            url: "http://interface-ag.de".to_owned(),
            descr: "descr".to_owned(),
            lon: 11.0788608,
            lat: 49.456742399999996,
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
        let conn_mtx = Arc::new(Mutex::new(establish_db_connection()));
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
            url: "http://interface-ag.de".to_owned(),
            descr: "descr".to_owned(),
            lon: 11.0788608,
            lat: 49.456742399999996,
        };

        let mut req = test::TestRequest::post()
            .uri("/api/shop")
            .set_json(&json)
            .to_request();
        let _ = app.call(req).await.unwrap();

        json.url = "http://if-lab.de".to_owned();
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
        let conn_mtx = Arc::new(Mutex::new(establish_db_connection()));
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
