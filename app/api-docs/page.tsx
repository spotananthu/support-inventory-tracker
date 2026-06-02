import { getApiDocs } from "@/lib/swagger";
import SwaggerPage from "./SwaggerUI";

export default async function ApiDocsPage() {
  const spec = getApiDocs();
  return <SwaggerPage spec={spec} />;
}
