table! {
    use diesel::sql_types::*;
    use diesel_geography::sql_types::*;

    shops (id) {
        id -> Int4,
        title -> Varchar,
        url -> Varchar,
        descr -> Text,
        location -> Geography,
        last_edited -> Timestamp,
    }
}

table! {
    use diesel::sql_types::*;
    use diesel_geography::sql_types::*;

    spatial_ref_sys (srid) {
        srid -> Int4,
        auth_name -> Nullable<Varchar>,
        auth_srid -> Nullable<Int4>,
        srtext -> Nullable<Varchar>,
        proj4text -> Nullable<Varchar>,
    }
}

allow_tables_to_appear_in_same_query!(
    shops,
    spatial_ref_sys,
);
