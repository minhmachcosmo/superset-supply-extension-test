/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { t, validateNonEmpty } from '@superset-ui/core';
import { ControlPanelConfig } from '@superset-ui/chart-controls';

const columnChoices = (state: any) => ({
  choices: (state.datasource?.columns || []).map(
    (c: any) => [c.column_name, c.verbose_name || c.column_name],
  ),
});

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'name_column',
            config: {
              type: 'SelectControl',
              label: t('Name Column'),
              description: t('Column containing the warehouse name'),
              default: null,
              mapStateToProps: columnChoices,
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'address_column',
            config: {
              type: 'SelectControl',
              label: t('Address Column'),
              description: t('Column containing the warehouse address'),
              default: null,
              mapStateToProps: columnChoices,
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'latitude_column',
            config: {
              type: 'SelectControl',
              label: t('Latitude Column'),
              description: t('Column containing the GPS latitude'),
              default: null,
              mapStateToProps: columnChoices,
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'longitude_column',
            config: {
              type: 'SelectControl',
              label: t('Longitude Column'),
              description: t('Column containing the GPS longitude'),
              default: null,
              mapStateToProps: columnChoices,
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'stock_column',
            config: {
              type: 'SelectControl',
              label: t('Stock Column'),
              description: t('Column containing the stock size'),
              default: null,
              mapStateToProps: columnChoices,
            },
          },
        ],
        ['adhoc_filters'],
        [
          {
            name: 'row_limit',
            config: {
              type: 'TextControl',
              label: 'Row limit',
              default: 10000,
            },
          },
        ],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'database_id',
            config: {
              type: 'TextControl',
              label: t('Database ID'),
              description: t(
                'Superset database ID used for UPDATE queries (find it in Settings → Database Connections)',
              ),
              default: '1',
              renderTrigger: false,
            },
          },
        ],
        [
          {
            name: 'table_name',
            config: {
              type: 'TextControl',
              label: t('Table Name'),
              description: t('SQL table name to update when a warehouse is moved'),
              default: 'warehouses',
              renderTrigger: false,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
