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
import {
  QueryFormData,
} from '@superset-ui/core';

export interface SupersetBreweryExtensionTest1StylesProps {
  height: number;
  width: number;
}

export interface StockSimulationDataRecord {
  Simulation_run: string;
  Probe_instance: string;
  Probe_run: number;
  StockMeasure: number;
  csm_run_id: string;
  run_name: string;
}

interface SupersetBreweryExtensionTest1CustomizeProps {
  chartTitle: string;
  showLegend: boolean;
  showGrid: boolean;
  lineSmooth: boolean;
  xAxisColumn: string;
  yAxisColumn: string;
  seriesColumn: string;
}

export type SupersetBreweryExtensionTest1QueryFormData = QueryFormData &
  SupersetBreweryExtensionTest1StylesProps &
  SupersetBreweryExtensionTest1CustomizeProps;

export type SupersetBreweryExtensionTest1Props = SupersetBreweryExtensionTest1StylesProps &
  SupersetBreweryExtensionTest1CustomizeProps & {
    data: StockSimulationDataRecord[];
  };
