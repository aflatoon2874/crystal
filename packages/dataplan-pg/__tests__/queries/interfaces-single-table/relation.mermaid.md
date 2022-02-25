```mermaid
graph TD
    classDef path fill:#eee,stroke:#000,color:#000
    classDef plan fill:#fff,stroke-width:3px,color:#000
    classDef itemplan fill:#fff,stroke-width:6px,color:#000
    classDef sideeffectplan fill:#f00,stroke-width:6px,color:#000
    classDef bucket fill:#f6f6f6,color:#000,stroke-width:6px


    %% define plans
    __Value_3["__Value[_3∈0]<br /><context>"]:::plan
    __Value_5["__Value[_5∈0]<br /><rootValue>"]:::plan
    __TrackedObject_6["__TrackedObject[_6∈0]"]:::plan
    InputStaticLeaf_7["InputStaticLeaf[_7∈0]"]:::plan
    PgSelect_8[["PgSelect[_8∈0]<br /><single_table_items>"]]:::plan
    First_12["First[_12∈0]"]:::plan
    PgSelectSingle_13["PgSelectSingle[_13∈1]<br /><single_table_items>"]:::plan
    PgClassExpression_14["PgClassExpression[_14∈1]<br /><__single_t...s__.”type”>"]:::plan
    Lambda_15["Lambda[_15∈1]"]:::plan
    PgSingleTablePolymorphic_16["PgSingleTablePolymorphic[_16∈1]"]:::plan
    PgClassExpression_17["PgClassExpression[_17∈1]<br /><__single_t...parent_id”>"]:::plan
    First_22["First[_22∈1]"]:::plan
    PgSelectSingle_23["PgSelectSingle[_23∈2]<br /><single_table_items>"]:::plan
    PgClassExpression_24["PgClassExpression[_24∈2]<br /><__single_t...s__.”type”>"]:::plan
    Lambda_25["Lambda[_25∈2]"]:::plan
    PgSingleTablePolymorphic_26["PgSingleTablePolymorphic[_26∈2]"]:::plan
    First_33["First[_33∈2]"]:::plan
    PgSelectSingle_34["PgSelectSingle[_34∈2]<br /><people>"]:::plan
    PgClassExpression_35["PgClassExpression[_35∈2]<br /><__people__.”username”>"]:::plan
    PgClassExpression_72["PgClassExpression[_72∈1]<br /><__single_t...ems__.”id”>"]:::plan
    Lambda_81["Lambda[_81∈2]"]:::plan
    PgSingleTablePolymorphic_82["PgSingleTablePolymorphic[_82∈2]"]:::plan
    Lambda_137["Lambda[_137∈2]"]:::plan
    PgSingleTablePolymorphic_138["PgSingleTablePolymorphic[_138∈2]"]:::plan
    Lambda_193["Lambda[_193∈2]"]:::plan
    PgSingleTablePolymorphic_194["PgSingleTablePolymorphic[_194∈2]"]:::plan
    Lambda_249["Lambda[_249∈2]"]:::plan
    PgSingleTablePolymorphic_250["PgSingleTablePolymorphic[_250∈2]"]:::plan
    Access_290["Access[_290∈0]<br /><_3.pgSettings>"]:::plan
    Access_291["Access[_291∈0]<br /><_3.withPgClient>"]:::plan
    Object_292["Object[_292∈0]<br /><{pgSettings,withPgClient}>"]:::plan
    Map_297["Map[_297∈2]<br /><_23:{”0”:1}>"]:::plan
    List_298["List[_298∈2]<br /><_297>"]:::plan
    Map_299["Map[_299∈1]<br /><_13:{”0”:1,”1”:2}>"]:::plan
    List_300["List[_300∈1]<br /><_299>"]:::plan

    %% plan dependencies
    __Value_5 --> __TrackedObject_6
    Object_292 --> PgSelect_8
    InputStaticLeaf_7 --> PgSelect_8
    PgSelect_8 --> First_12
    First_12 --> PgSelectSingle_13
    PgSelectSingle_13 --> PgClassExpression_14
    PgClassExpression_14 --> Lambda_15
    Lambda_15 --> PgSingleTablePolymorphic_16
    PgSelectSingle_13 --> PgSingleTablePolymorphic_16
    PgSelectSingle_13 --> PgClassExpression_17
    List_300 --> First_22
    First_22 --> PgSelectSingle_23
    PgSelectSingle_23 --> PgClassExpression_24
    PgClassExpression_24 --> Lambda_25
    Lambda_25 --> PgSingleTablePolymorphic_26
    PgSelectSingle_23 --> PgSingleTablePolymorphic_26
    List_298 --> First_33
    First_33 --> PgSelectSingle_34
    PgSelectSingle_34 --> PgClassExpression_35
    PgSelectSingle_13 --> PgClassExpression_72
    PgClassExpression_24 --> Lambda_81
    Lambda_81 --> PgSingleTablePolymorphic_82
    PgSelectSingle_23 --> PgSingleTablePolymorphic_82
    PgClassExpression_24 --> Lambda_137
    Lambda_137 --> PgSingleTablePolymorphic_138
    PgSelectSingle_23 --> PgSingleTablePolymorphic_138
    PgClassExpression_24 --> Lambda_193
    Lambda_193 --> PgSingleTablePolymorphic_194
    PgSelectSingle_23 --> PgSingleTablePolymorphic_194
    PgClassExpression_24 --> Lambda_249
    Lambda_249 --> PgSingleTablePolymorphic_250
    PgSelectSingle_23 --> PgSingleTablePolymorphic_250
    __Value_3 --> Access_290
    __Value_3 --> Access_291
    Access_290 --> Object_292
    Access_291 --> Object_292
    PgSelectSingle_23 --> Map_297
    Map_297 --> List_298
    PgSelectSingle_13 --> Map_299
    Map_299 --> List_300

    %% plan-to-path relationships
    P1["~"]
    __TrackedObject_6 -.-> P1
    P2[">item"]
    PgSingleTablePolymorphic_16 -.-> P2
    P3[">item>parent"]
    PgSingleTablePolymorphic_26 -.-> P3
    P4[">item>p…t>id x25"]
    PgClassExpression_17 -.-> P4
    P5[">item>p…t>author x25"]
    PgSelectSingle_34 -.-> P5
    P6[">item>p…t>a…r>username x25"]
    PgClassExpression_35 -.-> P6
    P7[">item>id x5"]
    PgClassExpression_72 -.-> P7
    P8[">item>parent"]
    PgSingleTablePolymorphic_82 -.-> P8
    P9[">item>parent"]
    PgSingleTablePolymorphic_138 -.-> P9
    P10[">item>parent"]
    PgSingleTablePolymorphic_194 -.-> P10
    P11[">item>parent"]
    PgSingleTablePolymorphic_250 -.-> P11

    %% allocate buckets
    classDef bucket0 stroke:#696969
    class __Value_3,__Value_5,__TrackedObject_6,InputStaticLeaf_7,PgSelect_8,First_12,Access_290,Access_291,Object_292 bucket0
    classDef bucket1 stroke:#a52a2a
    class PgSelectSingle_13,PgClassExpression_14,Lambda_15,PgSingleTablePolymorphic_16,PgClassExpression_17,First_22,PgClassExpression_72,Map_299,List_300 bucket1
    classDef bucket2 stroke:#808000
    class PgSelectSingle_23,PgClassExpression_24,Lambda_25,PgSingleTablePolymorphic_26,First_33,PgSelectSingle_34,PgClassExpression_35,Lambda_81,PgSingleTablePolymorphic_82,Lambda_137,PgSingleTablePolymorphic_138,Lambda_193,PgSingleTablePolymorphic_194,Lambda_249,PgSingleTablePolymorphic_250,Map_297,List_298 bucket2

    subgraph Buckets
    Bucket0("Bucket 0 (root)<br />~"):::bucket
    style Bucket0 stroke:#696969
    Bucket1("Bucket 1 (polymorphic_16[SingleTableTopic|SingleTablePost|SingleTableDivider|SingleTableChecklist|SingleTableChecklistItem])<br />>item"):::bucket
    style Bucket1 stroke:#a52a2a
    Bucket0 --> Bucket1
    Bucket2("Bucket 2 (polymorphic_26[SingleTableTopic|SingleTablePost|SingleTableDivider|SingleTableChecklist|SingleTableChecklistItem])<br />>item>parent"):::bucket
    style Bucket2 stroke:#808000
    Bucket1 --> Bucket2
    end
```