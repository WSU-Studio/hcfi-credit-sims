/**
 * Lead inquiry — GetPagingStageWebsiteLead (Postman v1.8 Lead Inquiry).
 */
export type WebsiteLeadStage = {
  LeadNo: string;
  ApprovalCode: string | null;
  CustName: string;
  AssetName: string;
  IdNo: string;
  LeadStepCode: string;
  LeadStepDescr: string;
  LeadStatCode: string;
  LeadStatDescr: string;
  CreatedDt: string;
  LastUpdDt: string;
  IsFromForward: boolean;
  IsTakenFromDealer: boolean;
  ChannelCode: string;
  UserInputName: string | null;
};
