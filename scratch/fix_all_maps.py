import re

def fix_all_maps():
    with open('frontend/app/cases/[id]/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('decisionTimeline.map((item, idx)', 'decisionTimeline.map((item: any, idx: number)')
    content = content.replace('LIFECYCLE_STEPS.map((step, idx)', 'LIFECYCLE_STEPS.map((step: any, idx: number)')
    content = content.replace('caseAuditEvents.map((evt)', 'caseAuditEvents.map((evt: any)')
    content = content.replace('policyResult.checks.map((chk)', 'policyResult.checks.map((chk: any)')
    
    with open('frontend/app/cases/[id]/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_all_maps()
