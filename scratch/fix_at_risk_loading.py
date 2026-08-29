import re

def add_loading_error():
    with open('frontend/app/at-risk/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the destructuring of useCasesApi
    content = content.replace(
        'const { items: apiCases, isLoading: isApiLoading } = useCasesApi({',
        'const { items: apiCases, isLoading: isApiLoading, error: apiError } = useCasesApi({'
    )

    # Insert loading/error handling right before the table render block.
    # The table is inside <div className="mt-6 border border-slate-200/60 dark:border-border-subtle rounded-xl overflow-hidden bg-white dark:bg-surface shadow-sm">
    table_pattern = r'<div className="mt-6 border border-slate-200/60 dark:border-border-subtle rounded-xl overflow-hidden bg-white dark:bg-surface shadow-sm">'
    
    loading_error_jsx = """
        {apiError && (
          <div className="mt-6 p-8 text-center border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
            <h3 className="text-sm font-medium text-rose-800 dark:text-rose-400">Failed to load cases</h3>
            <p className="text-xs text-rose-600 dark:text-rose-500 mt-1">{apiError.message || "An unexpected error occurred."}</p>
          </div>
        )}
        
        {isApiLoading && !apiError && (
          <div className="mt-6 p-8 text-center border border-slate-200/60 dark:border-border-subtle rounded-xl animate-pulse text-slate-500 text-sm">
            Loading cases...
          </div>
        )}

        {!isApiLoading && !apiError && (
          <div className="mt-6 border border-slate-200/60 dark:border-border-subtle rounded-xl overflow-hidden bg-white dark:bg-surface shadow-sm">
"""
    
    content = content.replace(table_pattern, loading_error_jsx)

    # Need to close the added conditional `{!isApiLoading && !apiError && (` wrapper block.
    # The div ends with `</div>` right before ` {/* Drawer */}`
    close_pattern = r'</div>\s*{/\* Drawer \*/}'
    content = re.sub(close_pattern, '</div>\n        )}\n\n        {/* Drawer */}', content)

    with open('frontend/app/at-risk/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    add_loading_error()
