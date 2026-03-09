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
import React, { useMemo } from 'react';
import { styled } from '@superset-ui/core';
import ReactECharts from 'echarts-for-react';
import { SupersetBreweryExtensionTest1Props, SupersetBreweryExtensionTest1StylesProps } from './types';

const Styles = styled.div<SupersetBreweryExtensionTest1StylesProps>`
  padding: ${({ theme }) => theme.gridUnit * 2}px;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
`;

export default function SupersetBreweryExtensionTest1(props: SupersetBreweryExtensionTest1Props) {
  const { 
    data, 
    height, 
    width, 
    chartTitle,
    showLegend,
    showGrid,
    lineSmooth,
    xAxisColumn,
    yAxisColumn,
    seriesColumn,
  } = props;

  const chartOption = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Data Available',
          left: 'center',
          top: 'middle',
        },
      };
    }

    // Group data by series
    const seriesMap = new Map<string, { x: number; y: number }[]>();

    data.forEach((record: any) => {
      const seriesName = record[seriesColumn] || 'Unknown';
      const xValue = record[xAxisColumn];
      const yValue = record[yAxisColumn];

      if (!seriesMap.has(seriesName)) {
        seriesMap.set(seriesName, []);
      }

      seriesMap.get(seriesName)?.push({ x: xValue, y: yValue });
    });

    // Sort data within each series by x value
    seriesMap.forEach((seriesData) => {
      seriesData.sort((a, b) => a.x - b.x);
    });

    // Prepare series for ECharts
    const series = Array.from(seriesMap.entries()).map(([name, values]) => ({
      name,
      type: 'line',
      smooth: lineSmooth,
      data: values.map(v => [v.x, v.y]),
      symbolSize: 6,
      emphasis: {
        focus: 'series',
      },
    }));

    return {
      title: {
        text: chartTitle,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        show: showLegend,
        top: 40,
        type: 'scroll',
        orient: 'horizontal',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: showLegend ? '15%' : '10%',
        containLabel: true,
        show: showGrid,
        borderColor: '#ddd',
      },
      xAxis: {
        type: 'value',
        name: xAxisColumn,
        nameLocation: 'middle',
        nameGap: 30,
        splitLine: {
          show: showGrid,
        },
      },
      yAxis: {
        type: 'value',
        name: yAxisColumn,
        nameLocation: 'middle',
        nameGap: 50,
        splitLine: {
          show: showGrid,
        },
      },
      series,
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
          },
          restore: {},
          saveAsImage: {},
        },
        right: 20,
        top: 10,
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          start: 0,
          end: 100,
          bottom: 20,
        },
      ],
    };
  }, [data, chartTitle, showLegend, showGrid, lineSmooth, xAxisColumn, yAxisColumn, seriesColumn]);

  return (
    <Styles height={height} width={width}>
      <ReactECharts
        option={chartOption}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </Styles>
  );
}
