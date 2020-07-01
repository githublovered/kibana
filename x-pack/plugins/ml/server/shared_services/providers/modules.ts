/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  ILegacyScopedClusterClient,
  KibanaRequest,
  SavedObjectsClientContract,
} from 'kibana/server';
import { DataRecognizer } from '../../models/data_recognizer';
import { SharedServicesChecks } from '../shared_services';

export interface ModulesProvider {
  modulesProvider(
    mlClusterClient: ILegacyScopedClusterClient,
    request: KibanaRequest,
    savedObjectsClient: SavedObjectsClientContract
  ): {
    recognize: DataRecognizer['findMatches'];
    getModule: DataRecognizer['getModule'];
    listModules: DataRecognizer['listModules'];
    setupModuleItems: DataRecognizer['setupModuleItems'];
  };
}

export function getModulesProvider({
  isFullLicense,
  getHasMlCapabilities,
}: SharedServicesChecks): ModulesProvider {
  return {
    modulesProvider(
      mlClusterClient: ILegacyScopedClusterClient,
      request: KibanaRequest,
      savedObjectsClient: SavedObjectsClientContract
    ) {
      const hasMlCapabilities = getHasMlCapabilities(request);
      const dr = dataRecognizerFactory(mlClusterClient, savedObjectsClient);
      return {
        async recognize(...args) {
          isFullLicense();
          await hasMlCapabilities(['canCreateJob']);

          return dr.findMatches(...args);
        },
        async getModule(moduleId: string) {
          isFullLicense();
          await hasMlCapabilities(['canGetJobs']);

          return dr.getModule(moduleId);
        },
        async listModules() {
          isFullLicense();
          await hasMlCapabilities(['canGetJobs']);

          return dr.listModules();
        },
        async setupModuleItems(...args) {
          isFullLicense();
          await hasMlCapabilities(['canCreateJob']);

          return dr.setupModuleItems(...args);
        },
      };
    },
  };
}

function dataRecognizerFactory(
  mlClusterClient: ILegacyScopedClusterClient,
  savedObjectsClient: SavedObjectsClientContract
) {
  return new DataRecognizer(mlClusterClient, savedObjectsClient);
}
