use crate::error::DBError;
use crate::schema::shops;
use chrono::NaiveDateTime;
use diesel::dsl::sql_query;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use diesel::sql_types::Float8;
use diesel::sql_types::Integer;
use diesel_geography::types::GeogPoint;
use dotenv::dotenv;
use std::env;
use std::fmt::Debug;
use std::string::String;

#[derive(Identifiable, Queryable, QueryableByName, PartialEq, Debug)]
#[table_name = "shops"]
pub struct Shop {
    pub id: i32,
    pub title: String,
    pub url: Option<String>,
    pub donation_url: Option<String>,
    pub location: GeogPoint,
    pub last_edited: NaiveDateTime,
}

#[derive(Insertable, PartialEq, Debug)]
#[table_name = "shops"]
pub struct NewShop {
    pub title: String,
    pub url: Option<String>,
    pub donation_url: Option<String>,
    pub location: GeogPoint,
}

pub fn establish_db_connection() -> Result<PgConnection, ConnectionError> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    PgConnection::establish(&database_url)
}

pub fn get_shops_in_range(
    conn: &PgConnection,
    location: GeogPoint,
    distance_m: i32,
) -> Result<Vec<Shop>, DBError> {
    let query = sql_query(
        "SELECT * FROM shops
        WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)",
    )
    .bind::<Float8, _>(location.x)
    .bind::<Float8, _>(location.y)
    .bind::<Integer, _>(distance_m);
    let shops: Vec<Shop> = query.get_results(conn)?;
    Ok(shops)
}

pub fn insert_new_shop(conn: &PgConnection, new_shop: &NewShop) -> Result<Shop, DBError> {
    let dao: Shop = diesel::insert_into(shops::table)
        .values(new_shop)
        .get_result(conn)?;
    Ok(dao)
}

pub fn update_shop(conn: &PgConnection, new_shop: NewShop) -> Result<Shop, DBError> {
    use crate::schema::shops::dsl::*;
    let dao: Shop = diesel::update(shops)
        .filter(location.eq(new_shop.location))
        .filter(title.eq(new_shop.title))
        .set(url.eq(new_shop.url))
        .get_result(conn)?;

    Ok(dao)
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_db_connection() {
        establish_db_connection().unwrap();
    }

    #[test]
    fn test_insert_shop() {
        let conn = establish_db_connection().unwrap();
        let shop = NewShop {
            title: "Test Shop".to_owned(),
            url: Some("http://www.interface-ag.de".to_owned()),
            donation_url: None,
            location: GeogPoint {
                x: 11.0788608,
                y: 49.456742399999,
                srid: None,
            },
        };

        let result = insert_new_shop(&conn, &shop);
        assert_eq!(true, result.is_ok());
    }

    #[test]
    fn test_update_shop() {
        let conn = establish_db_connection().unwrap();
        let mut shop = NewShop {
            title: "Test Shop".to_owned(),
            url: Some("http://www.interface-ag.de".to_owned()),
            donation_url: None,
            location: GeogPoint {
                x: 11.0788608,
                y: 49.456742399999996,
                srid: None,
            },
        };
        
        let _ = insert_new_shop(&conn, &shop);

        shop.url = Some("http://www.if-lab.de".to_owned());
        let result = update_shop(&conn, shop).unwrap();
        assert_eq!(result.url.unwrap(), "http://www.if-lab.de".to_owned());
    }

    #[test]
    fn test_get_shops() {
        let conn = establish_db_connection().unwrap();
        let result = get_shops_in_range(
            &conn,
            GeogPoint {
                x: 11.0788608,
                y: 49.456742399999996,
                srid: None,
            },
            10000,
        );
        assert_eq!(true, result.is_ok());
    }
}
