/*
 * Copyright (C) 2017 NASA World Wind
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 */
package gov.nasa.worldwind.gs.geopkg;

import java.util.Arrays;
import java.util.HashSet;

/**
 *
 * @author Bruce Schubert
 */
public class SQLiteUtils {

    /**
     * SQLite keywords.
     *
     * @see
     * <a href=https://www.sqlite.org/lang_keywords.html>https://www.sqlite.org/lang_keywords.html</a>
     */
    public static final HashSet<String> SQL_KEYWORDS = new HashSet<>(Arrays.asList(
            new String[]{"ABORT",
                "ACTION",
                "ADD",
                "AFTER",
                "ALL",
                "ALTER",
                "ANALYZE",
                "AND",
                "AS",
                "ASC",
                "ATTACH",
                "AUTOINCREMENT",
                "BEFORE",
                "BEGIN",
                "BETWEEN",
                "BY",
                "CASCADE",
                "CASE",
                "CAST",
                "CHECK",
                "COLLATE",
                "COLUMN",
                "COMMIT",
                "CONFLICT",
                "CONSTRAINT",
                "CREATE",
                "CROSS",
                "CURRENT_DATE",
                "CURRENT_TIME",
                "CURRENT_TIMESTAMP",
                "DATABASE",
                "DEFAULT",
                "DEFERRABLE",
                "DEFERRED",
                "DELETE",
                "DESC",
                "DETACH",
                "DISTINCT",
                "DROP",
                "EACH",
                "ELSE",
                "END",
                "ESCAPE",
                "EXCEPT",
                "EXCLUSIVE",
                "EXISTS",
                "EXPLAIN",
                "FAIL",
                "FOR",
                "FOREIGN",
                "FROM",
                "FULL",
                "GLOB",
                "GROUP",
                "HAVING",
                "IF",
                "IGNORE",
                "IMMEDIATE",
                "IN",
                "INDEX",
                "INDEXED",
                "INITIALLY",
                "INNER",
                "INSERT",
                "INSTEAD",
                "INTERSECT",
                "INTO",
                "IS",
                "ISNULL",
                "JOIN",
                "KEY",
                "LEFT",
                "LIKE",
                "LIMIT",
                "MATCH",
                "NATURAL",
                "NO",
                "NOT",
                "NOTNULL",
                "NULL",
                "OF",
                "OFFSET",
                "ON",
                "OR",
                "ORDER",
                "OUTER",
                "PLAN",
                "PRAGMA",
                "PRIMARY",
                "QUERY",
                "RAISE",
                "RECURSIVE",
                "REFERENCES",
                "REGEXP",
                "REINDEX",
                "RELEASE",
                "RENAME",
                "REPLACE",
                "RESTRICT",
                "RIGHT",
                "ROLLBACK",
                "ROW",
                "SAVEPOINT",
                "SELECT",
                "SET",
                "TABLE",
                "TEMP",
                "TEMPORARY",
                "THEN",
                "TO",
                "TRANSACTION",
                "TRIGGER",
                "UNION",
                "UNIQUE",
                "UPDATE",
                "USING",
                "VACUUM",
                "VALUES",
                "VIEW",
                "VIRTUAL",
                "WHEN",
                "WHERE",
                "WITH",
                "WITHOUT"}));

    /**
     * Returns true if the string is a valid SQLite identifier.
     *
     * @param string Text to be evaluated
     * @return True if the text consists solely of alphanumeric or underscore
     * characters, does not start with a digit and is not a keyword.
     */
    public static boolean isValidIdentifier(String string) {
        if (string == null || string.isEmpty()) {
            return false;
        }
        if (isKeyword(string)) {
            return false;
        }
        if (Character.isDigit(string.charAt(0))) {
            return false;
        }
        return isAlphaNumericOrUnderscore(string);
    }

    /**
     * Returns true if the string matches an SQLite keyword.
     *
     * @param string To be evaluated
     * @return True if the text matches a keyword
     */
    public static boolean isKeyword(String string) {
        for (String keyword : SQL_KEYWORDS) {
            if (keyword.equalsIgnoreCase(string)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns true if the text contains soley alphanumeric or underscore
     * characters.
     *
     * @param string To be evaluated
     * @return True if no non-alphanumeric or underscores found
     */
    public static boolean isAlphaNumericOrUnderscore(String string) {
        String pattern = "^[a-zA-Z0-9_]*$";
        return string.matches(pattern);
    }

}
