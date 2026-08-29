import re

def fix_bracket():
    for file in ['HttpCampaignRepository.ts', 'HttpCommunicationRepository.ts', 'HttpAuditRepository.ts', 'HttpPolicyRepository.ts']:
        with open(f'frontend/lib/services/http/{file}', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove the wrongly appended string
        if 'public async resetToInitial(): Promise<any> {' in content:
            # find index of last '}' before 'public async resetToInitial'
            idx = content.rfind('}', 0, content.find('public async resetToInitial'))
            if idx != -1:
                # remove the '}' and put it at the end
                content = content[:idx] + content[idx+1:] + '\n}\n'
            
            with open(f'frontend/lib/services/http/{file}', 'w', encoding='utf-8') as f:
                f.write(content)

if __name__ == '__main__':
    fix_bracket()
