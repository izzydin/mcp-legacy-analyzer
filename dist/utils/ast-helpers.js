/**
 * Safely extracts the starting line number from a Babel AST node.
 * Uses a fallback of 0 for generated or malformed nodes lacking location data.
 */
export function getSafeLineNumber(node) {
    return node?.loc?.start?.line ?? 0;
}
/**
 * Safely extracts the starting column number from a Babel AST node.
 * Uses a fallback of 0.
 */
export function getSafeColumnNumber(node) {
    return node?.loc?.start?.column ?? 0;
}
/**
 * Safely extracts the ending line number from a Babel AST node.
 * Uses a fallback of 0.
 */
export function getSafeEndLineNumber(node) {
    return node?.loc?.end?.line ?? 0;
}
