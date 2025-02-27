# SOCR Central Limit Theorem (CLT) HTML5 Webapp

![](https://github.com/SOCR/socr-clt-webapp/blob/6199b4c57800fe83fd168ebbd38cbf82503f2185/src/SOCR_CLT_webapp_HTML5.png)

## Project info

This [SOCR webapp](https://socr.umich.edu/HTML5/) shows a very general demonstration of the Central Limit Theorem (CLT). There is a [supplementary SOCR activity (learning module)](https://wiki.socr.umich.edu/index.php/SOCR_EduMaterials_Activities_GeneralCentralLimitTheorem) is based on an earlier version of the SOCR Sampling Distribution CLT Experiment. This experiment builds upon a RVLS CLT applet by extending the applet functionality and providing the capability of sampling from any SOCR Distribution. 

## How can I edit this code?

There are several ways of editing this web-application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ce3b1264-08b8-43b0-990d-5f763b7177f1) and start prompting.

Changes made via Lovable will be committed automatically to this [GitHub repo](https://github.com/SOCR/socr-clt-webapp/).

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ce3b1264-08b8-43b0-990d-5f763b7177f1) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

# References
 - [SOCR CLT Paper](https://doi.org/10.1080/10691898.2008.11889560)
 - [SOCR CLT learning activity](https://wiki.socr.umich.edu/index.php/SOCR_EduMaterials_Activities_GeneralCentralLimitTheorem)
 - [Earlier SOCR CLT Java applet](http://socr.ucla.edu/htmls/SOCR_Experiments.html) and [Java source code](https://github.com/SOCR/SOCR-Java/blob/master/src/edu/ucla/stat/SOCR/experiments/SamplingDistributionExperiment.java)
 - [Lovable AI Engineer Project](https://lovable.dev/projects/ce3b1264-08b8-43b0-990d-5f763b7177f1)
 - [SOCR CLT Webapp deloyment](https://socr-clt-webapp.lovable.app/)
