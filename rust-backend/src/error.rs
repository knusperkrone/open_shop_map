use std::error;
use std::fmt;

#[derive(Debug)]
pub enum DBError {
    DieselError(diesel::result::Error),
    ValidationError(std::string::String),
}

impl fmt::Display for DBError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            DBError::DieselError(e) => e.fmt(f),
            DBError::ValidationError(url) => write!(f, "{}", url),
        }
    }
}

impl error::Error for DBError {}

impl From<diesel::result::Error> for DBError {
    fn from(err: diesel::result::Error) -> Self {
        DBError::DieselError(err)
    }
}

impl From<url::ParseError> for DBError {
    fn from(err: url::ParseError) -> Self {
        DBError::ValidationError(format!("{}", err))
    }
}
