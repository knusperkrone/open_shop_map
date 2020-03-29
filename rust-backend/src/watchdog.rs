use crate::logging::APP_LOGGING;
use chrono::{Duration, Utc};
use dotenv::dotenv;
use std::env;

pub async fn watch_db_conn() {
    dotenv().ok();
    let timeout_sec: i64 = env::var("DATABASE_TIMEOUT")
        .expect("DATABASE_TIMEOUT must be set")
        .parse()
        .unwrap();

    info!(APP_LOGGING, "Watchdog testing db connection");
    let end_time = Utc::now() + Duration::seconds(timeout_sec);
    loop {
        if let Ok(_) = crate::models::establish_db_connection() {
            info!(APP_LOGGING, "Watchdog connected to db");
            return;
        } else if Utc::now() > end_time {
            error!(APP_LOGGING, "Watchdog failed!");
            panic!("Dind't connect to database in time");
        }
        // timeout
        info!(APP_LOGGING, "Watchdog timeout");
        tokio::time::delay_for(std::time::Duration::from_secs(1)).await;
    }
}
