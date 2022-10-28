/* eslint-disable */

const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin' || process.env.NOTARIZE !== 'true') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log('Notarizing app');

  return await notarize({
    tool: 'notarytool',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.MACOS_CSC_APPLE_ID,
    appleIdPassword: process.env.MACOS_CSC_APPLE_APP_PASSWORD,
    teamId: process.env.MACOS_CSC_TEAM_ID,
  });
};
