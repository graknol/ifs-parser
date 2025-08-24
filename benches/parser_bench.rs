use criterion::{black_box, criterion_group, criterion_main, Criterion};
use ifs_parser::{parse_source, Language};

fn benchmark_plsql_parsing(c: &mut Criterion) {
    let source = r#"
        @Override
        PROCEDURE Test_Proc__ (
            param1_ IN VARCHAR2,
            param2_ OUT NUMBER
        ) IS
        BEGIN
            super(param1_, param2_);
            param2_ := 42;
        END Test_Proc__;
    "#;

    c.bench_function("parse plsql", |b| {
        b.iter(|| parse_source(black_box(source), black_box(Language::PlSql)))
    });
}

fn benchmark_entity_parsing(c: &mut Criterion) {
    let source = r#"
        entityname Customer;
        component CRM;
        
        attributes {
            key CustomerSeq NUMBER K-I--;
            public CustomerId TEXT(10)/UPPERCASE AMI-L {
                LabelText "Customer ID";
            }
            public Name TEXT(200) AMIUL;
        }
    "#;

    c.bench_function("parse entity", |b| {
        b.iter(|| parse_source(black_box(source), black_box(Language::Entity)))
    });
}

criterion_group!(benches, benchmark_plsql_parsing, benchmark_entity_parsing);
criterion_main!(benches);
