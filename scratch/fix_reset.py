import re

def fix_reset():
    for file in ['HttpCampaignRepository.ts', 'HttpCommunicationRepository.ts', 'HttpAuditRepository.ts', 'HttpPolicyRepository.ts']:
        with open(f'frontend/lib/services/http/{file}', 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'resetToInitial' not in content:
            if 'Campaign' in file:
                content += "\n  public async resetToInitial(): Promise<any> {\n    return this.getAllCampaigns();\n  }\n"
            elif 'Communication' in file:
                content += "\n  public async resetToInitial(): Promise<any> {\n    return this.getAllCommunications();\n  }\n"
            elif 'Audit' in file:
                content += "\n  public async resetToInitial(): Promise<any> {\n    return this.getAllEvents();\n  }\n"
            elif 'Policy' in file:
                content += "\n  public async resetToInitial(): Promise<any> {\n    return this.getActivePolicy();\n  }\n"
            
            with open(f'frontend/lib/services/http/{file}', 'w', encoding='utf-8') as f:
                f.write(content)

if __name__ == '__main__':
    fix_reset()
