# Import the pilot through GitHub

The existing Matador Pilot project is `i2tdfchw`. Its `production` dataset exists and is public. The initial import succeeded on October 7, 2026 in [GitHub Actions run 37576230977](https://github.com/higdonfrancis-luna/matador-pilot-chatgpt/actions/runs/37576230977). All 82 published pilot documents and their reference targets were also verified directly through Sanity's public API. The instructions below are retained for future imports; the initial import does not need to be repeated.

## Add the import credential

1. In Matador Pilot's Sanity management screen, open **API > Tokens > Add API token**.
2. Name it **Matador ChatGPT import** and select **Editor** permissions. Create the token and copy it privately. Sanity displays the value once.
3. Open the `higdonfrancis-luna/matador-pilot-chatgpt` GitHub repository. Choose **Settings > Secrets and variables > Actions > New repository secret**.
4. Use the exact name `SANITY_API_WRITE_TOKEN`. Paste the Sanity token into the **Secret** field and choose **Add secret**. Never put the token in repository files, chat, screenshots, or workflow inputs.

## Run the import

1. Open the repository's **Actions** tab.
2. Select **Import Matador content into Sanity**.
3. Choose **Run workflow**, leave the branch on **main**, then choose **Run workflow** again.
4. Open the run and wait for a green check. The successful run summary confirms that all 82 pilot documents exist in `i2tdfchw/production`.

The workflow validates the prepared content, creates missing documents, and verifies published reads without a token. Existing editor changes are preserved. It does not delete content, replace existing documents, upload media, or deploy the website. It runs only when manually started on `main`.

After a successful import, revoke this temporary import token in Sanity and remove its GitHub repository secret if no further imports are needed. Draft preview uses a separate Viewer token, configured in the frontend's server environment when hosting is set up.

The next step is to deploy the Next.js app with `NEXT_PUBLIC_SANITY_PROJECT_ID=i2tdfchw`, `NEXT_PUBLIC_SANITY_DATASET=production`, and `CONTENT_MODE=sanity`. The frontend origin and CORS settings will be configured for that deployment.

References: [Sanity token handling](https://www.sanity.io/docs/content-lake/http-auth), [GitHub repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [running a workflow manually](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).
