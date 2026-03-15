/**
 * Google Sheets-style function list by category.
 * @see https://support.google.com/docs/table/25273?hl=en
 */
export interface FunctionItem {
  name: string;
  syntax: string;
  description: string;
}

export const FUNCTIONS_BY_CATEGORY: Record<string, FunctionItem[]> = {
  'Math': [
    { name: 'SUM', syntax: 'SUM(value1, [value2, ...])', description: 'Sum of numbers' },
    { name: 'AVERAGE', syntax: 'AVERAGE(value1, [value2, ...])', description: 'Numerical average' },
    { name: 'COUNT', syntax: 'COUNT(value1, [value2, ...])', description: 'Count of numbers' },
    { name: 'MIN', syntax: 'MIN(value1, [value2, ...])', description: 'Minimum value' },
    { name: 'MAX', syntax: 'MAX(value1, [value2, ...])', description: 'Maximum value' },
    { name: 'ABS', syntax: 'ABS(value)', description: 'Absolute value' },
    { name: 'ROUND', syntax: 'ROUND(value, [places])', description: 'Round to decimal places' },
    { name: 'ROUNDUP', syntax: 'ROUNDUP(value, [places])', description: 'Round up' },
    { name: 'ROUNDDOWN', syntax: 'ROUNDDOWN(value, [places])', description: 'Round down' },
    { name: 'FLOOR', syntax: 'FLOOR(value, [factor])', description: 'Round down to multiple' },
    { name: 'CEILING', syntax: 'CEILING(value, [factor])', description: 'Round up to multiple' },
    { name: 'INT', syntax: 'INT(value)', description: 'Integer part' },
    { name: 'MOD', syntax: 'MOD(dividend, divisor)', description: 'Modulo remainder' },
    { name: 'POWER', syntax: 'POWER(base, exponent)', description: 'Base to exponent' },
    { name: 'SQRT', syntax: 'SQRT(value)', description: 'Square root' },
    { name: 'PI', syntax: 'PI()', description: 'Returns π' },
    { name: 'RAND', syntax: 'RAND()', description: 'Random 0–1' },
    { name: 'RANDBETWEEN', syntax: 'RANDBETWEEN(low, high)', description: 'Random integer' },
    { name: 'SIGN', syntax: 'SIGN(value)', description: 'Sign (-1, 0, 1)' },
    { name: 'TRUNC', syntax: 'TRUNC(value, [places])', description: 'Truncate' },
    { name: 'PRODUCT', syntax: 'PRODUCT(factor1, [factor2, ...])', description: 'Product of numbers' },
    { name: 'QUOTIENT', syntax: 'QUOTIENT(dividend, divisor)', description: 'Integer division' },
    { name: 'SUMSQ', syntax: 'SUMSQ(value1, [value2, ...])', description: 'Sum of squares' },
  ],
  'Statistical': [
    { name: 'MEDIAN', syntax: 'MEDIAN(value1, [value2, ...])', description: 'Median value' },
    { name: 'COUNTBLANK', syntax: 'COUNTBLANK(range)', description: 'Count empty cells' },
    { name: 'COUNTA', syntax: 'COUNTA(value1, [value2, ...])', description: 'Count non-empty' },
    { name: 'STDEV', syntax: 'STDEV(value1, [value2, ...])', description: 'Sample std deviation' },
    { name: 'VAR', syntax: 'VAR(value1, [value2, ...])', description: 'Sample variance' },
    { name: 'LARGE', syntax: 'LARGE(data, n)', description: 'Nth largest' },
    { name: 'SMALL', syntax: 'SMALL(data, n)', description: 'Nth smallest' },
  ],
  'Logical': [
    { name: 'IF', syntax: 'IF(condition, value_if_true, value_if_false)', description: 'Conditional' },
    { name: 'AND', syntax: 'AND(logical1, [logical2, ...])', description: 'Logical AND' },
    { name: 'OR', syntax: 'OR(logical1, [logical2, ...])', description: 'Logical OR' },
    { name: 'NOT', syntax: 'NOT(logical)', description: 'Logical NOT' },
    { name: 'TRUE', syntax: 'TRUE()', description: 'Returns TRUE' },
    { name: 'FALSE', syntax: 'FALSE()', description: 'Returns FALSE' },
    { name: 'IFERROR', syntax: 'IFERROR(value, [value_if_error])', description: 'Return value or if error' },
  ],
  'Text': [
    { name: 'CONCATENATE', syntax: 'CONCATENATE(string1, [string2, ...])', description: 'Join strings' },
    { name: 'LEFT', syntax: 'LEFT(string, [num_chars])', description: 'Left substring' },
    { name: 'RIGHT', syntax: 'RIGHT(string, [num_chars])', description: 'Right substring' },
    { name: 'MID', syntax: 'MID(string, start, length)', description: 'Middle substring' },
    { name: 'LEN', syntax: 'LEN(text)', description: 'String length' },
    { name: 'UPPER', syntax: 'UPPER(text)', description: 'Uppercase' },
    { name: 'LOWER', syntax: 'LOWER(text)', description: 'Lowercase' },
    { name: 'TRIM', syntax: 'TRIM(text)', description: 'Remove extra spaces' },
    { name: 'TEXT', syntax: 'TEXT(number, format)', description: 'Format as text' },
    { name: 'VALUE', syntax: 'VALUE(text)', description: 'Text to number' },
    { name: 'CHAR', syntax: 'CHAR(number)', description: 'Character from code' },
    { name: 'CODE', syntax: 'CODE(string)', description: 'Code of first char' },
    { name: 'REPT', syntax: 'REPT(text, count)', description: 'Repeat text' },
  ],
  'Date': [
    { name: 'TODAY', syntax: 'TODAY()', description: 'Current date' },
    { name: 'NOW', syntax: 'NOW()', description: 'Current date and time' },
    { name: 'DATE', syntax: 'DATE(year, month, day)', description: 'Date from parts' },
    { name: 'DAY', syntax: 'DAY(date)', description: 'Day of month' },
    { name: 'MONTH', syntax: 'MONTH(date)', description: 'Month (1–12)' },
    { name: 'YEAR', syntax: 'YEAR(date)', description: 'Year' },
    { name: 'DAYS', syntax: 'DAYS(end_date, start_date)', description: 'Days between dates' },
    { name: 'WEEKDAY', syntax: 'WEEKDAY(date, [type])', description: 'Day of week' },
  ],
  'Info': [
    { name: 'ISBLANK', syntax: 'ISBLANK(value)', description: 'True if empty' },
    { name: 'ISNUMBER', syntax: 'ISNUMBER(value)', description: 'True if number' },
    { name: 'ISTEXT', syntax: 'ISTEXT(value)', description: 'True if text' },
    { name: 'ISERROR', syntax: 'ISERROR(value)', description: 'True if error' },
    { name: 'ISEVEN', syntax: 'ISEVEN(value)', description: 'True if even' },
    { name: 'ISODD', syntax: 'ISODD(value)', description: 'True if odd' },
  ],
  'Lookup': [
    { name: 'ROW', syntax: 'ROW([reference])', description: 'Row number' },
    { name: 'COLUMN', syntax: 'COLUMN([reference])', description: 'Column number' },
    { name: 'CHOOSE', syntax: 'CHOOSE(index, choice1, [choice2, ...])', description: 'Pick by index' },
  ],
};

export const ALL_FUNCTION_NAMES = Object.values(FUNCTIONS_BY_CATEGORY).flatMap((arr) => arr.map((f) => f.name));
