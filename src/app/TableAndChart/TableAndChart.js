"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ReactPaginate from "react-paginate";
import styles from "./TableAndChart.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TableAndChart = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState("All"); // Default to "All"
  const [searchText, setSearchText] = useState("");
  const [transactionStats, setTransactionStats] = useState({
    totalAmount: 0,
    totalSold: 0,
    totalNotSold: 0,
  });
  const [priceRanges, setPriceRanges] = useState([]); // Holds price range data for the chart
  const itemsPerPage = 10;

  const monthMap = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  useEffect(() => {
    axios
      .get(
        "https://cors-anywhere.herokuapp.com/https://s3.amazonaws.com/roxiler.com/product_transaction.json"
      )
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    const filtered = selectedMonth === "All"
      ? data
      : data.filter((item) => {
          const saleDate = new Date(item.dateOfSale);
          return saleDate.getMonth() === monthMap[selectedMonth];
        });
    setFilteredData(filtered);
    setCurrentPage(0); // Reset to first page when data changes
    calculateTransactionStats(filtered); // Calculate stats for selected month
    fetchPriceRanges(filtered); // Calculate price ranges for selected month
  }, [data, selectedMonth]);

  const calculateTransactionStats = (filteredData) => {
    let totalAmount = 0;
    let totalSold = 0;
    let totalNotSold = 0;

    filteredData.forEach((item) => {
      totalAmount += item.price;
      if (item.sold) {
        totalSold += 1;
      } else {
        totalNotSold += 1;
      }
    });

    setTransactionStats({
      totalAmount,
      totalSold,
      totalNotSold,
    });
  };

  const fetchPriceRanges = (filteredData) => {
    const ranges = [
      { range: "$0 - $50", min: 0, max: 50 },
      { range: "$51 - $100", min: 51, max: 100 },
      { range: "$101 - $150", min: 101, max: 150 },
      { range: "$151+", min: 151, max: Infinity },
    ];

    const priceCounts = ranges.map((range) => {
      const count = filteredData.filter((item) => {
        const price = item.price;
        return price >= range.min && price <= range.max;
      }).length;
      return { range: range.range, count };
    });

    setPriceRanges(priceCounts);
  };

  const handleSearch = (event) => {
    const text = event.target.value.toLowerCase();
    setSearchText(text);

    const searchedData = data.filter((item) => {
      const saleDate = new Date(item.dateOfSale);
      const matchesMonth = selectedMonth === "All" || saleDate.getMonth() === monthMap[selectedMonth];
      const matchesSearch =
        item.title.toLowerCase().includes(text) ||
        item.description.toLowerCase().includes(text) ||
        item.price.toString().includes(text);
      return matchesMonth && matchesSearch;
    });
    setFilteredData(searchedData);
    setCurrentPage(0); // Reset to first page when search changes
  };

  const categories = {};
  filteredData.forEach((item) => {
    categories[item.category] = (categories[item.category] || 0) + 1;
  });

  const chartData = {
    labels: priceRanges.map((range) => range.range),
    datasets: [
      {
        label: "Number of Items in Price Range",
        data: priceRanges.map((range) => range.count),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
        borderColor: "#fff",
        borderWidth: 2,
        borderRadius: 8,
        barPercentage: 0.8,
      },
    ],
  };

  const offset = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(offset, offset + itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Product Transactions</h2>

      <div className={styles.controls}>
        <select
          className={styles.dropdown}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="All">All Months</option>
          {Object.keys(monthMap).map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search transaction..."
          className={styles.searchBox}
          value={searchText}
          onChange={handleSearch}
        />
      </div>

      {/* Product Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Sold</th>
              <th>Transaction Date</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.title}</td>
                <td>{item.category}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>{item.sold ? "Yes" : "No"}</td>
                <td>{new Date(item.dateOfSale).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReactPaginate
        previousLabel={"← Previous"}
        nextLabel={"Next →"}
        pageCount={Math.ceil(filteredData.length / itemsPerPage)}
        onPageChange={handlePageClick}
        containerClassName={styles.pagination}
        activeClassName={styles.active}
      />

      {/* Bar Chart */}
      <h2 className={styles.heading}>Product Distribution by Price Range</h2>
      <div className={styles.chartContainer}>
        <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>

      {/* Transaction Statistics Section */}
      <section className={styles.statsSection}>
        <h3 className={styles.statsHeading}>Transaction Statistics for {selectedMonth}</h3>
        <div className={styles.statsContainer}>
          <div className={styles.statsCard}>
            <h4>Total Sales Amount</h4>
            <p>${transactionStats.totalAmount.toFixed(2)}</p>
          </div>
          <div className={styles.statsCard}>
            <h4>Total Sold Items</h4>
            <p>{transactionStats.totalSold}</p>
          </div>
          <div className={styles.statsCard}>
            <h4>Total Not Sold Items</h4>
            <p>{transactionStats.totalNotSold}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TableAndChart;
