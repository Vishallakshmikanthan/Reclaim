import re

def fix_import():
    with open('frontend/app/cases/[id]/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('import React, { useState, useMemo } from "react";', 'import React, { useState, useMemo, useEffect } from "react";')
    with open('frontend/app/cases/[id]/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_import()
