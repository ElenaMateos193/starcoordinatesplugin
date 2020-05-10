import { resolve } from 'path';
import { existsSync } from 'fs';

import { i18n } from '@kbn/i18n';

export default function(kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'starcoordinates',
    uiExports: {
      app: {
        title: 'Starcoordinates',
        description: 'Star coordinates visualisations',
        main: 'plugins/starcoordinates/app',
      },
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    // eslint-disable-next-line no-unused-vars
    init(server, options) {
      const xpackMainPlugin = server.plugins.xpack_main;
      if (xpackMainPlugin) {
        const featureId = 'starcoordinates';

        xpackMainPlugin.registerFeature({
          id: featureId,
          name: i18n.translate('starcoordinates.featureRegistry.featureName', {
            defaultMessage: 'starcoordinates',
          }),
          navLinkId: featureId,
          icon: 'questionInCircle',
          app: [featureId, 'kibana'],
          catalogue: [],
          privileges: {
            all: {
              api: [],
              savedObject: {
                all: [],
                read: [],
              },
              ui: ['show'],
            },
            read: {
              api: [],
              savedObject: {
                all: [],
                read: [],
              },
              ui: ['show'],
            },
          },
        });
      }
    },
  });
}
