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
mod watchdog;

#[actix_rt::main]
async fn main() -> Result<(), std::io::Error> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() == 2 && args[1] == "--watchdog" {
        watchdog::watch_db_conn().await;
        Ok(())
    } else {
        rest::dispatch_server().await
    }
}
