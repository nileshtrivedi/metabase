/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { push } from "react-router-redux";

import { fetchDatabaseMetadata } from "metabase/redux/metadata";
import { setErrorPage } from "metabase/redux/app";

import {
  getDashboardComplete,
  getCardData,
  getSlowCards,
  getParameters,
  getParameterValues,
} from "metabase/dashboard/selectors";

import * as dashboardActions from "metabase/dashboard/dashboard";

import type { Dashboard } from "metabase/meta/types/Dashboard";
import type { Parameter } from "metabase/meta/types/Parameter";

import _ from "underscore";

const mapStateToProps = (state, props) => {
  return {
    dashboard: getDashboardComplete(state, props),
    dashcardData: getCardData(state, props),
    slowCards: getSlowCards(state, props),
    parameters: getParameters(state, props),
    parameterValues: getParameterValues(state, props),
  };
};

const mapDispatchToProps = {
  ...dashboardActions,
  fetchDatabaseMetadata,
  setErrorPage,
  onChangeLocation: push,
};

type Props = {
  location?: { query: { [key: string]: string } },
  dashboardId: string,

  dashboard?: Dashboard,
  parameters: Parameter[],
  parameterValues: { [key: string]: string },

  initialize: () => void,
  isFullscreen: boolean,
  isNightMode: boolean,
  fetchDashboard: (
    dashId: string,
    query?: { [key: string]: string },
  ) => Promise<void>,
  fetchDashboardCardData: (options: {
    reload: boolean,
    clear: boolean,
  }) => Promise<void>,
  setParameterValue: (id: string, value: string) => void,
  setErrorPage: (error: { status: number }) => void,
};

export default (ComposedComponent: ReactClass<any>) =>
  connect(mapStateToProps, mapDispatchToProps)(
    class DashboardContainer extends Component {
      props: Props;

      async load(props) {
        const {
          initialize,
          fetchDashboard,
          fetchDashboardCardData,
          setErrorPage,
          location,
          dashboardId,
        } = props;

        initialize();
        try {
          await fetchDashboard(dashboardId, location && location.query);
          await fetchDashboardCardData({ reload: false, clear: true });
        } catch (error) {
          console.error(error);
          setErrorPage(error);
        }
      }

      componentWillMount() {
        this.load(this.props);
      }

      componentWillReceiveProps(nextProps: Props) {
        if (nextProps.dashboardId !== this.props.dashboardId) {
          this.load(nextProps);
        } else if (
          !_.isEqual(this.props.parameterValues, nextProps.parameterValues)
        ) {
          this.props.fetchDashboardCardData({ reload: false, clear: true });
        }
      }

      render() {
        return <ComposedComponent {...this.props} />;
      }
    },
  );
