export interface EmailConfig {
  logoUrl: string;
  sendingDomain: string;
  companyName: string;
  companyAddress: string;
}

export const defaultConfig: EmailConfig = {
  logoUrl: "",
  sendingDomain: "",
  companyName: "",
  companyAddress: "",
};
