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
import { ChartProps, supersetTheme } from '@superset-ui/core';
import transformProps from '../../src/plugin/transformProps';

describe('SupplychainWarehouse transformProps', () => {
  const formData = {
    datasource: '3__table',
    granularity_sqla: 'ds',
    viz_type: 'supplychain_warehouse',
    name_column: 'name',
    address_column: 'address',
    latitude_column: 'latitude',
    longitude_column: 'longitude',
    stock_column: 'stock_size',
    database_id: 1,
    table_name: 'warehouses',
  };
  const chartProps = new ChartProps({
    formData,
    width: 800,
    height: 600,
    theme: supersetTheme,
    queriesData: [{
      data: [{
        id: 1,
        name: 'Rotterdam Euro Hub',
        address: 'Maasvlakte 2, Rotterdam',
        latitude: 51.9244,
        longitude: 4.4777,
        stock_size: 45000,
      }],
    }],
  });

  it('should transform chart props and map warehouse records', () => {
    const result = transformProps(chartProps);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.tableName).toBe('warehouses');
    expect(result.databaseId).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 1,
      name: 'Rotterdam Euro Hub',
      latitude: 51.9244,
      longitude: 4.4777,
      stock_size: 45000,
    });
  });
});
