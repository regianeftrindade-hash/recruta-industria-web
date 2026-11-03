declare module "nodemailer/lib/mail-composer" {
  type MailAttachment = {
    filename?: string;
    content?: Buffer | string;
    contentType?: string;
  };

  type MailOptions = {
    from?: string;
    to?: string;
    subject?: string;
    html?: string;
    text?: string;
    replyTo?: string;
    inReplyTo?: string;
    references?: string;
    headers?: Record<string, string>;
    attachments?: MailAttachment[];
  };

  export default class MailComposer {
    constructor(mail: MailOptions);
    compile(): {
      build(): Promise<Buffer>;
    };
  }
}
