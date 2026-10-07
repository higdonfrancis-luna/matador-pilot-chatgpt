export type CmsImage={alt?:string;asset?:{_ref:string};crop?:{top:number;bottom:number;left:number;right:number};hotspot?:{x:number;y:number;width:number;height:number}};
export type RichBlock = {_type:string;_key?:string;[key:string]:unknown};
export type ContentBlock = {_key:string;key:string;label:string;kind:'text'|'richText'|'link';text?:string;body?:RichBlock[];href?:string};
export type Section = {_key:string;title:string;blocks:ContentBlock[]};
export type ContentDocument = {
 _id:string;_type:string;name?:string;firm?:string;quote?:string;logoUrl?:string;photoUrl?:string;
 logoAssetUrl?:string;photoAssetUrl?:string;imageAssetUrl?:string;thumbnailAssetUrl?:string;
 image?:CmsImage;logo?:CmsImage;photo?:CmsImage;thumbnail?:CmsImage;
 firmName?:string;practiceArea?:string;reviewer?:string;youtubeUrl?:string;thumbnailUrl?:string;sourceUrl?:string;
 title?:string;metric?:string;summary?:string;services?:string[];imageUrl?:string;alt?:string;
};
export type HomePage = ContentDocument & {
 heroTitle:string;heroBody:RichBlock[];seoTitle:string;seoDescription:string;sections:Section[];
 heroTestimonials:ContentDocument[];footerTestimonials:ContentDocument[];memberVideos:ContentDocument[];
 caseStudies:ContentDocument[];resources:ContentDocument[];firmExperiences:ContentDocument[];
 clientLogos:ContentDocument[];pressLogos:ContentDocument[];
};
