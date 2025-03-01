"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownIcon, ArrowUpIcon, InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Particles } from "@/components/magicui/particles";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Removed Tabs import

// Sample data for token distribution
const tokenDistributionData = [
  { name: "Bitcoin (BTC)", value: 45, color: "#F7931A" },
  { name: "Ethereum (ETH)", value: 30, color: "#627EEA" },
  { name: "Solana (SOL)", value: 10, color: "#00FFA3" },
  { name: "Cardano (ADA)", value: 8, color: "#0033AD" },
  { name: "Polkadot (DOT)", value: 7, color: "#E6007A" },
];

// Sample data for returns over time
const returnsOverTimeData = {
  "1D": Array.from({ length: 24 }, (_, i) => ({
    date: `${i}:00`,
    value: 2500 + Math.random() * 100 - 50,
  })),
  "1W": Array.from({ length: 7 }, (_, i) => ({
    date: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
    value: 2500 + Math.random() * 200 - 100,
  })),
  "1M": [
    { date: "Jan", value: 1000, pnl: 0 },
    { date: "Feb", value: 1200, pnl: 20 },
    { date: "Mar", value: 1150, pnl: -4.17 },
    { date: "Apr", value: 1300, pnl: 13.04 },
    { date: "May", value: 1500, pnl: 15.38 },
    { date: "Jun", value: 1450, pnl: -3.33 },
    { date: "Jul", value: 1600, pnl: 10.34 },
    { date: "Aug", value: 1750, pnl: 9.38 },
    { date: "Sep", value: 1900, pnl: 8.57 },
    { date: "Oct", value: 2100, pnl: 10.53 },
    { date: "Nov", value: 2300, pnl: 9.52 },
    { date: "Dec", value: 2500, pnl: 8.7 },
  ],
  "3M": [
    { date: "Jan", value: 1000, pnl: 0 },
    { date: "Feb", value: 1200, pnl: 20 },
    { date: "Mar", value: 1150, pnl: -4.17 },
    { date: "Apr", value: 1300, pnl: 13.04 },
    { date: "May", value: 1500, pnl: 15.38 },
    { date: "Jun", value: 1450, pnl: -3.33 },
  ],
  "6M": [
    { date: "Jul", value: 1600, pnl: 10.34 },
    { date: "Aug", value: 1750, pnl: 9.38 },
    { date: "Sep", value: 1900, pnl: 8.57 },
    { date: "Oct", value: 2100, pnl: 10.53 },
    { date: "Nov", value: 2300, pnl: 9.52 },
    { date: "Dec", value: 2500, pnl: 8.7 },
  ],
  "1Y": [
    { date: "Jan", value: 1000, pnl: 0 },
    { date: "Feb", value: 1200, pnl: 20 },
    { date: "Mar", value: 1150, pnl: -4.17 },
    { date: "Apr", value: 1300, pnl: 13.04 },
    { date: "May", value: 1500, pnl: 15.38 },
    { date: "Jun", value: 1450, pnl: -3.33 },
    { date: "Jul", value: 1600, pnl: 10.34 },
    { date: "Aug", value: 1750, pnl: 9.38 },
    { date: "Sep", value: 1900, pnl: 8.57 },
    { date: "Oct", value: 2100, pnl: 10.53 },
    { date: "Nov", value: 2300, pnl: 9.52 },
    { date: "Dec", value: 2500, pnl: 8.7 },
  ],
};

// Custom tooltip for the token distribution chart
const TokenDistributionTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-md p-3">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-muted-foreground">{`${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

export default function PortfolioDashboard() {
  const [timeframe, setTimeframe] = useState("1Y");

  // Calculate total portfolio value
  const totalValue =
    returnsOverTimeData["1Y"][returnsOverTimeData["1Y"].length - 1].value;
  const previousValue =
    returnsOverTimeData["1Y"][returnsOverTimeData["1Y"].length - 2].value;
  const percentageChange = ((totalValue - previousValue) / previousValue) * 100;

  return (
    <div className="relative h-screen pt-6 w-full">
      {/* Particles background */}
      <Particles
        className="absolute inset-0 z-0 pointer-events-none w-full"
        quantity={150}
        ease={80}
        size={0.6}
        color={"#ff2158"}
        refresh
      />

      {/* Main container */}
      <div className="relative z-10 bg-transparent bg-blue-100 max-w-6xl mx-auto w-full h-screen px-4 flex flex-col">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#ff2158] ml-2">
              Portfolio Dashboard
            </h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Value
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total value of all assets in portfolio</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalValue.toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {percentageChange > 0 ? (
                    <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={
                      percentageChange > 0 ? "text-green-500" : "text-red-500"
                    }
                  >
                    {percentageChange.toFixed(2)}%
                  </span>
                  <span className="ml-1">vs yesterday</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Annual Return
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total return since the beginning of the year</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+24.6%</div>
                <div className="text-xs text-muted-foreground">
                  Year-to-date performance
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Token Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tokenDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }: any) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {tokenDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip>
                        <TokenDistributionTooltip />
                      </Tooltip>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Returns Over Time</CardTitle>
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant={timeframe === "1D" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeframe("1D")}
                  >
                    1D
                  </Button>
                  <Button
                    variant={timeframe === "1W" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeframe("1W")}
                  >
                    1W
                  </Button>
                  <Button
                    variant={timeframe === "1M" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeframe("1M")}
                  >
                    1M
                  </Button>
                  <Button
                    variant={timeframe === "3M" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeframe("3M")}
                  >
                    3M
                  </Button>
                  <Button
                    variant={timeframe === "6M" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeframe("6M")}
                  >
                    6M
                  </Button>
                  <Button
                    variant={timeframe === "1Y" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeframe("1Y")}
                  >
                    1Y
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ChartContainer
                    config={{
                      value: {
                        label: "Portfolio Value",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="w-full"
                  >
                    <AreaChart
                      data={
                        returnsOverTimeData[
                          timeframe as keyof typeof returnsOverTimeData
                        ]
                      }
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorValue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--chart-1))"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--chart-1))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" />
                      <YAxis
                        tickFormatter={(value) => `$${value}`}
                        domain={["dataMin - 100", "dataMax + 100"]}
                      />
                      <CartesianGrid strokeDasharray="3 3" />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => `$${value}`}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--color-value)"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Removed Tabs section */}
        </div>
      </div>
    </div>
  );
}
