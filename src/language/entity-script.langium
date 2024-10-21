grammar EntityScript

entry Model:
  (entities+=Entity | relations+=Relation | links+=Link )*;

Entity:
  'entity' name=ID '{' attributes+=EAttribute (COMMA attributes+=EAttribute)* '}';

Attribute:
  name=ID type=TYPE;

EAttribute:
  (primary?='primary')? name=ID type=TYPE;

Relation:
  'relation' desc=STRING 'as' name=ID '{' (attributes+=Attribute (COMMA attributes+=Attribute)*)? '}';

Link:
  entity=[Entity:ID] mult=MULT relation=[Relation:ID];


hidden terminal WS: /\s+/;
terminal TYPE:
  /INTEGER|SMALLINT|TINYINT|BIGINT|DECIMAL\((\d+),(\d+)\)|NUMERIC\((\d+),(\d+)\)|FLOAT|REAL|DOUBLE PRECISION|CHAR\((\d+)\)|VARCHAR\((\d+)\)|TEXT|NCHAR\((\d+)\)|NVARCHAR\((\d+)\)|DATE|TIME|TIMESTAMP/;
terminal ID: /[_a-zA-Z][\w_]*/;
// terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal COMMA: /,/;
terminal MULT: /(0,1|0,N|1,1|1,N)/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
