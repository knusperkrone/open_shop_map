#[macro_use]
extern crate diesel;
#[macro_use]
extern crate slog;

mod error;
mod logging;
mod models;
mod rest;
mod schema;
mod valiator;

#[actix_rt::main]
async fn main() {
    rest::dispatch_server().await;
}
