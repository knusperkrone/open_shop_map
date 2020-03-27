use dotenv::dotenv;
use once_cell::sync::Lazy;
use slog::{FnValue, *};
use sloggers::{
    terminal::{Destination, TerminalLoggerBuilder},
    types::Severity,
    Build,
};
use std::env;
use std::fs::OpenOptions;
use std::sync::Mutex;

pub static APP_LOGGING: Lazy<slog::Logger> = Lazy::new(|| {
    let mut builder = TerminalLoggerBuilder::new();
    if cfg!(test) {
        builder.level(Severity::Debug);
        builder.destination(Destination::Stdout);
    } else {
        dotenv().ok();
        let log_dir = env::var("LOG_DIR").expect("LOG_DIR must be set");
        let logfile = format!("{}/log_app.txt", log_dir);
        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .append(true)
            .open(logfile)
            .unwrap();
        let filter_level = "info".parse::<Level>().expect("Invalid log level filter");
        Logger::root(
            Mutex::new(LevelFilter::new(slog_bunyan::default(file), filter_level)).fuse(),
            o!("location" => FnValue(move |info| {
                format!("{}:{} {}", info.file(), info.line(), info.module())
                })
            ),
        );
    }

    builder.build().unwrap()
});
