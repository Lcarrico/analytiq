"""
Warehouse interface abstraction — dialect-aware, parameterized SQL generation.

Sprint 1 / F-002: a single WarehouseInterface contract with pluggable dialects.
All generated SQL is parameterized (no literal interpolation) and identifiers
are quoted per-dialect. Dialects are stateless → thread-safe by construction.
"""
from __future__ import annotations

import threading


# ─────────────────────────────────────────────────────────
# Structured errors
# ─────────────────────────────────────────────────────────
class WarehouseError(Exception):
    """Base error. `code` is a stable machine-readable identifier."""
    code = 'warehouse_error'

    def __init__(self, message, code=None):
        super().__init__(message)
        if code:
            self.code = code

    def to_dict(self):
        return {'error': str(self), 'code': self.code}


class UnknownDialectError(WarehouseError):
    code = 'unknown_dialect'


class SqlCompileError(WarehouseError):
    code = 'invalid_spec'


class UnsupportedFeatureError(WarehouseError):
    code = 'unsupported_feature'


# ─────────────────────────────────────────────────────────
# Interface + base implementation
# ─────────────────────────────────────────────────────────
class WarehouseInterface:
    """Contract: compile_select / compile_create_table / compile_insert_select /
    quote_identifier / parameterize. Implementations must be stateless."""

    name = 'abstract'
    placeholder = '?'
    # semantic type → SQL type
    TYPE_MAP: dict[str, str] = {}

    # -- identifiers / params --------------------------------------------
    def quote_identifier(self, ident: str) -> str:
        if ident is None or ident == '':
            raise SqlCompileError('Identifier must be a non-empty string')
        ident = str(ident)
        return '"' + ident.replace('"', '""') + '"'

    def parameterize(self) -> str:
        return self.placeholder

    # -- SELECT ----------------------------------------------------------
    def compile_select(self, spec: dict) -> tuple[str, list]:
        if not isinstance(spec, dict) or not spec.get('table'):
            raise SqlCompileError('select spec requires a "table"')
        cols = spec.get('columns') or ['*']
        col_sql = ', '.join('*' if c == '*' else self.quote_identifier(c) for c in cols)
        sql = f'SELECT {col_sql} FROM {self.quote_identifier(spec["table"])}'
        params: list = []
        where = spec.get('where') or {}
        if where:
            if not isinstance(where, dict):
                raise SqlCompileError('"where" must be a mapping of column → value')
            clauses = []
            for k, v in where.items():
                clauses.append(f'{self.quote_identifier(k)} = {self.parameterize()}')
                params.append(v)
            sql += ' WHERE ' + ' AND '.join(clauses)
        if spec.get('group_by'):
            sql += ' GROUP BY ' + ', '.join(self.quote_identifier(c) for c in spec['group_by'])
        if spec.get('order_by'):
            parts = []
            for c in spec['order_by']:
                if isinstance(c, (list, tuple)):
                    col, direction = c
                    direction = 'DESC' if str(direction).upper() == 'DESC' else 'ASC'
                    parts.append(f'{self.quote_identifier(col)} {direction}')
                else:
                    parts.append(self.quote_identifier(c))
            sql += ' ORDER BY ' + ', '.join(parts)
        if spec.get('limit') is not None:
            try:
                limit = int(spec['limit'])
            except (TypeError, ValueError):
                raise SqlCompileError('"limit" must be an integer')
            sql += f' LIMIT {self.parameterize()}'
            params.append(limit)
        return sql, params

    # -- CREATE TABLE ------------------------------------------------------
    def map_type(self, semantic_type: str) -> str:
        try:
            return self.TYPE_MAP[semantic_type]
        except KeyError:
            raise UnsupportedFeatureError(
                f'semantic type "{semantic_type}" is not supported by dialect {self.name}',
                code='unsupported_type')

    def compile_create_table(self, spec: dict) -> str:
        if not isinstance(spec, dict) or not spec.get('table'):
            raise SqlCompileError('create_table spec requires a "table"')
        columns = spec.get('columns')
        if not columns:
            raise SqlCompileError('create_table spec requires non-empty "columns"')
        col_defs = []
        for col in columns:
            if not isinstance(col, dict) or not col.get('name') or not col.get('type'):
                raise SqlCompileError('each column requires "name" and "type"')
            col_defs.append(f'{self.quote_identifier(col["name"])} {self.map_type(col["type"])}')
        ine = 'IF NOT EXISTS ' if spec.get('if_not_exists') else ''
        return (f'CREATE TABLE {ine}{self.quote_identifier(spec["table"])} '
                f'({", ".join(col_defs)})')

    # -- INSERT INTO … SELECT ---------------------------------------------
    def compile_insert_select(self, spec: dict) -> tuple[str, list]:
        if not isinstance(spec, dict) or not spec.get('target'):
            raise SqlCompileError('insert_select spec requires a "target"')
        if not spec.get('select'):
            raise SqlCompileError('insert_select spec requires a "select" spec')
        cols = spec.get('columns') or []
        col_sql = ''
        if cols:
            col_sql = ' (' + ', '.join(self.quote_identifier(c) for c in cols) + ')'
        select_sql, params = self.compile_select(spec['select'])
        sql = f'INSERT INTO {self.quote_identifier(spec["target"])}{col_sql} {select_sql}'
        return sql, params

    # -- EXPLAIN -----------------------------------------------------------
    def explain_sql(self, sql: str) -> str:
        if not sql or not isinstance(sql, str):
            raise SqlCompileError('explain_sql requires a SQL string')
        return f'EXPLAIN {sql}'


class SQLiteDialect(WarehouseInterface):
    name = 'sqlite'
    placeholder = '?'
    TYPE_MAP = {
        'id': 'INTEGER', 'measure': 'REAL', 'dimension': 'TEXT', 'date': 'TEXT',
        'flag': 'INTEGER', 'text': 'TEXT', 'geo': 'TEXT', 'unknown': 'TEXT',
    }

    def explain_sql(self, sql):
        return f'EXPLAIN QUERY PLAN {sql}'


class PostgresDialect(WarehouseInterface):
    name = 'postgres'
    placeholder = '%s'
    TYPE_MAP = {
        'id': 'BIGINT', 'measure': 'DOUBLE PRECISION', 'dimension': 'TEXT', 'date': 'DATE',
        'flag': 'BOOLEAN', 'text': 'TEXT', 'geo': 'TEXT', 'unknown': 'TEXT',
    }


class SnowflakeDialect(WarehouseInterface):
    name = 'snowflake'
    placeholder = '%s'
    TYPE_MAP = {
        'id': 'NUMBER(38,0)', 'measure': 'FLOAT', 'dimension': 'VARCHAR', 'date': 'DATE',
        'flag': 'BOOLEAN', 'text': 'VARCHAR', 'geo': 'GEOGRAPHY', 'unknown': 'VARIANT',
    }


# ─────────────────────────────────────────────────────────
# Dialect registry (pluggable, loadable by name)
# ─────────────────────────────────────────────────────────
_registry: dict[str, type[WarehouseInterface]] = {}
_registry_lock = threading.Lock()


def register_dialect(name: str, dialect_cls: type) -> None:
    if not issubclass(dialect_cls, WarehouseInterface):
        raise WarehouseError('dialect must subclass WarehouseInterface', code='invalid_dialect')
    with _registry_lock:
        _registry[name.lower()] = dialect_cls


def get_dialect(name: str) -> WarehouseInterface:
    with _registry_lock:
        cls = _registry.get((name or '').lower())
    if cls is None:
        raise UnknownDialectError(f'Unknown dialect: {name!r}. '
                                  f'Registered: {sorted(_registry)}')
    return cls()


for _cls in (SQLiteDialect, PostgresDialect, SnowflakeDialect):
    register_dialect(_cls.name, _cls)
