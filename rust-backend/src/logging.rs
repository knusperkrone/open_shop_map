use once_cell::sync::Lazy;
use slog::{FnValue, *};
use sloggers::{
    terminal::{Destination, TerminalLoggerBuilder},
    types::Severity,
    Build,
};
use std::fs::OpenOptions;
use std::sync::Mutex;

pub static APP_LOGGING: Lazy<slog::Logger> = Lazy::new(|| {
    let mut builder = TerminalLoggerBuilder::new();
    if cfg!(test) {
        builder.level(Severity::Debug);
        builder.destination(Destination::Stdout);
    } else {
        let logfile = "./log/log_app.txt";
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
