import React from "react";
import { Link } from "react-router-dom";
import qs from "query-string";

import InventoryAdd from "./InventoryAdd";
import InventoryFilter from "./InventoryFilter";

function InventoryTable(props) {
  const inventoryRows = props.inventory.map(item => React.createElement(InventoryRow, { key: item._id, item: item, deleteItem: props.deleteItem }));
  return React.createElement(
    "table",
    null,
    React.createElement(
      "thead",
      null,
      React.createElement(
        "tr",
        null,
        React.createElement(
          "th",
          null,
          "ID"
        ),
        React.createElement(
          "th",
          null,
          "Status"
        ),
        React.createElement(
          "th",
          null,
          "Owner"
        ),
        React.createElement(
          "th",
          null,
          "Created"
        ),
        React.createElement(
          "th",
          null,
          "Effort"
        ),
        React.createElement(
          "th",
          null,
          "Completion Date"
        ),
        React.createElement(
          "th",
          null,
          "Title"
        ),
        React.createElement("th", null)
      )
    ),
    React.createElement(
      "tbody",
      null,
      inventoryRows
    )
  );
}

const InventoryRow = props => {
  function onDeleteClick() {
    props.deleteItem(props.item._id);
  }
  return React.createElement(
    "tr",
    null,
    React.createElement(
      "td",
      null,
      React.createElement(
        Link,
        { to: `/inventory/${props.item._id}` },
        props.item._id.substr(-4)
      )
    ),
    React.createElement(
      "td",
      null,
      props.item.status
    ),
    React.createElement(
      "td",
      null,
      props.item.owner
    ),
    React.createElement(
      "td",
      null,
      props.item.created.toDateString()
    ),
    React.createElement(
      "td",
      null,
      props.item.effort
    ),
    React.createElement(
      "td",
      null,
      props.item.completionDate ? props.item.completionDate.toDateString() : ""
    ),
    React.createElement(
      "td",
      null,
      props.item.title
    ),
    React.createElement(
      "td",
      null,
      React.createElement(
        "button",
        { onClick: onDeleteClick },
        "Delete"
      )
    )
  );
};

export default class InventoryList extends React.Component {
  constructor() {
    super();
    this.state = { inventory: [] };
    this.createItem = this.createItem.bind(this);
    this.setFilter = this.setFilter.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
  }
  componentDidMount() {
    this.loadData();
  }
  componentDidUpdate(prevProps) {
    const oldQuery = prevProps.location.search;
    const newQuery = this.props.location.search;
    if (oldQuery.status === newQuery.status && oldQuery.effort_gte === newQuery.effort_gte && oldQuery.effort_lte === newQuery.effort_lte) {
      return;
    }
    this.loadData();
  }
  setFilter(query) {
    this.props.history.push({
      pathname: this.props.location.pathname,
      search: `?${qs.stringify(query)}`
    });
  }
  loadData() {
    fetch(`/api/inventory${this.props.location.search}`).then(response => {
      if (response.ok) {
        response.json().then(data => {
          console.log(`Total count of records: ${data._metadata.total_count}`);
          data.records.forEach(item => {
            item.created = new Date(item.created);
            if (item.completionDate) item.completionDate = new Date(item.completionDate);
          });
          this.setState({ inventory: data.records });
        });
      } else {
        response.json().then(err => {
          console.error(`[API GET - Failed to fetch inventory]: ${err.message}`);
        });
      }
    }).catch(err => {
      console.error(`[API GET - ERROR to fetch inventory]: ${err}`);
    });
  }
  createIssue(newIssue) {
    fetch("/api/inventory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(newIssue)
    }).then(response => response.json()).then(updatedItem => {
      updatedItem.created = new Date(updatedItem.created);
      if (updatedItem.completionDate) updatedItem.completionDate = new Date(updatedItem.completionDate);
      const newIssues = this.state.inventory.concat(updatedItem);
      this.setState({ inventory: newIssues });
    }).catch(err => console.error(`Error in sending data to server: ${err.message}`));
  }
  deleteIssue(id) {
    fetch(`/api/inventory/${id}`, { method: "DELETE" }).then(response => {
      if (!response.ok) console.error("[MongoDB - DELETE ERROR]: Failed to delete item");else this.loadData();
    });
  }
  render() {
    return React.createElement(
      "div",
      null,
      React.createElement(InventoryFilter, {
        setFilter: this.setFilter,
        initFilter: this.props.location.search
      }),
      React.createElement("hr", null),
      React.createElement(InventoryTable, {
        inventory: this.state.inventory,
        deleteItem: this.deleteItem
      }),
      React.createElement("hr", null),
      React.createElement(InventoryAdd, { createItem: this.createItem })
    );
  }
}