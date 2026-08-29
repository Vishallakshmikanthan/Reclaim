import re

def fix_status():
    with open('frontend/lib/services/http/HttpCampaignRepository.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("campaign.status === 'running'", "campaign.status === 'RUNNING'")
    content = content.replace("campaign.status === 'paused'", "campaign.status === 'PAUSED'")
    with open('frontend/lib/services/http/HttpCampaignRepository.ts', 'w', encoding='utf-8') as f:
        f.write(content)

    with open('frontend/lib/context/ReclaimContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('status === "running"', 'status === "RUNNING"')
    content = content.replace('? "paused" : "running"', '? "PAUSED" : "RUNNING"')
    with open('frontend/lib/context/ReclaimContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_status()
