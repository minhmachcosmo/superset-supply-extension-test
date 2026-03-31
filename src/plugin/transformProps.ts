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
import { ChartProps } from '@superset-ui/core';
import { WarehouseRecord } from '../types';

export default function transformProps(chartProps: ChartProps) {
  const { width, height, formData, queriesData } = chartProps;
  const {
    nameColumn = 'name',
    addressColumn = 'address',
    latitudeColumn = 'latitude',
    longitudeColumn = 'longitude',
    stockColumn = 'stock_size',
    databaseId = 1,
    tableName = 'warehouses',
  } = formData;

  const rawData = (queriesData[0]?.data || []) as Record<string, unknown>[];

  const idCol = 'id';
  const nameCol = String(nameColumn);
  const addrCol = String(addressColumn);
  const latCol = String(latitudeColumn);
  const lngCol = String(longitudeColumn);
  const stockCol = String(stockColumn);

  const data: WarehouseRecord[] = rawData.map(row => ({
    id: Number(row[idCol] ?? row.ID ?? 0),
    name: String(row[nameCol] ?? ''),
    address: String(row[addrCol] ?? ''),
    latitude: Number(row[latCol] ?? 0),
    longitude: Number(row[lngCol] ?? 0),
    stock_size: Number(row[stockCol] ?? 0),
  }));

  return {
    width,
    height,
    data,
    nameColumn,
    addressColumn,
    latitudeColumn,
    longitudeColumn,
    stockColumn,
    databaseId: Number(databaseId),
    tableName,
  };
}
