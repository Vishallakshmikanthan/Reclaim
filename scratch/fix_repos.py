import re

def fix_repos():
    # HttpCampaign
    with open('frontend/lib/services/http/HttpCampaignRepository.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('getCampaigns()', 'getAllCampaigns()')
    content = content.replace('updateCampaign(', 'saveCampaign(')
    content = content.replace('createCampaign(', 'saveCampaign(')
    with open('frontend/lib/services/http/HttpCampaignRepository.ts', 'w', encoding='utf-8') as f:
        f.write(content)
        
    # HttpCommunication
    with open('frontend/lib/services/http/HttpCommunicationRepository.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('getCommunications()', 'getAllCommunications()')
    content = content.replace('saveCommunication(', 'addCommunication(')
    with open('frontend/lib/services/http/HttpCommunicationRepository.ts', 'w', encoding='utf-8') as f:
        f.write(content)

    # ReclaimContext
    with open('frontend/lib/context/ReclaimContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('services.campaignRepo.getCampaigns()', 'services.campaignRepo.getAllCampaigns()')
    content = content.replace('services.communicationRepo.getCommunications()', 'services.communicationRepo.getAllCommunications()')
    with open('frontend/lib/context/ReclaimContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_repos()
