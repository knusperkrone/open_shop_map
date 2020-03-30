use crate::error::DBError;
use crate::schema::shops;
use chrono::NaiveDateTime;
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
    search_location: GeogPoint,
    distance_m: i32,
) -> Result<Vec<Shop>, DBError> {
    use crate::schema::shops::dsl::*;
    use diesel::dsl::sql;
    let query = shops.filter(
        sql("ST_DWithin(location, ST_MakePoint(")
            .bind::<Float8, _>(search_location.x)
            .sql(",")
            .bind::<Float8, _>(search_location.y)
            .sql(")::geography,")
            .bind::<Integer, _>(distance_m)
            .sql(")"),
    );
    Ok(query.get_results(conn)?)
}

pub fn search_shops_in_range(
    conn: &PgConnection,
    name: &String,
    search_location: GeogPoint,
    distance_m: i32,
) -> Result<Vec<Shop>, DBError> {
    use crate::schema::shops::dsl::*;
    use diesel::dsl::sql;
    use diesel_trgm::*;
    let query = shops
        .filter(word_similarity(title, name).gt(0.4))
        .filter(
            sql("ST_DWithin(location, ST_MakePoint(")
                .bind::<Float8, _>(search_location.x)
                .sql(",")
                .bind::<Float8, _>(search_location.y)
                .sql(")::geography,")
                .bind::<Integer, _>(distance_m)
                .sql(")"),
        )
        .order(title.desc())
        .limit(5);
    Ok(query.get_results(conn)?)
}

pub fn insert_new_shop(conn: &PgConnection, new_shop: &NewShop) -> Result<Shop, DBError> {
    let query = diesel::insert_into(shops::table).values(new_shop);
    Ok(query.get_result(conn)?)
}

pub fn update_shop(conn: &PgConnection, new_shop: NewShop) -> Result<Shop, DBError> {
    use crate::schema::shops::dsl::*;
    let query = diesel::update(shops)
        .filter(location.eq(new_shop.location))
        .filter(title.eq(new_shop.title))
        .set(url.eq(new_shop.url));
    Ok(query.get_result(conn)?)
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
            title: "Models Test Shop".to_owned(),
            url: Some("http://www.interface-ag.de".to_owned()),
            donation_url: None,
            location: GeogPoint {
                x: 04.0788608,
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

    #[test]
    fn search_get_shops() {
        let conn = establish_db_connection().unwrap();
        let shop = NewShop {
            title: "Test Shop".to_owned(),
            url: Some("http://www.interface-ag.de".to_owned()),
            donation_url: None,
            location: GeogPoint {
                x: 11.0788608,
                y: 29.456742399996,
                srid: None,
            },
        };
        let _ = insert_new_shop(&conn, &shop);

        let conn = establish_db_connection().unwrap();
        let result = search_shops_in_range(
            &conn,
            &"Test ship".to_owned(),
            GeogPoint {
                x: 12.0788608,
                y: 59.456742399999996,
                srid: None,
            },
            10000,
        );
        assert_eq!(true, result.is_ok());
    }
}
