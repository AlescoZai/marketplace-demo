import React from "react";
import { Link, withRouter } from 'react-router-dom';
import { Grid, Row, Col, ControlLabel, FormGroup, FormControl, Button, Glyphicon } from "react-bootstrap";
import { image } from "./image";
import { addToCart, removeFromCart } from "../actions/shoppingCart";
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Snackbar from '@material-ui/core/Snackbar';
import axios from "../api/axiosInstance";
import { productsApi, unitsApi, currenciesApi } from "../api/apiURLs";
import LoadingScreen from "../components/LoadingScreen";
import InformationPanel from "../components/InformationPanel";
import { addToWishlist, removeFromWishlist } from "../actions/wishlist";
import { ADDED_TO_CART_SNACKBAR, ADDED_TO_WISHLIST_SNACKBAR } from "../api/strings";
import ProductList from './ProductList';

class Products extends React.Component {

    state = {
      products: [],
      unitsDimension: {},
      unitsWeight: {},
      currencies: {},
      query: '',
      storeId: null,
      autoHideDuration: 3000,
      isLoading: false,
      productsNotFound: false,
      snackbarOpen: false,
      snackbarMessage: '',
      userHasAuth: false
    };

    loadProducts() {
        this.setState(() => ({ isLoading: true }));

        let options = {},
            params = {};

        if (this.state.query) {
            params.q = this.state.query;
        }

        if (this.state.storeId) {
            params.store_id = this.state.storeId;
        }

        if (Object.keys(params).length) {
            options.params = params;
        }

        // Fetch the products.
        axios.get(productsApi, options).then((response) => (this.setState(
            {
                products: response.data.data,
                isLoading: false,
                productsNotFound: false
            }
        ))).catch((error) => (
            this.setState({
                isLoading: false,
                productsNotFound: true
            })
        ));
    }

    componentDidMount() {
        if (this.props.match && this.props.match.params.q) {
            this.setState({ query: this.props.match.params.q });
        }

        if (this.props.storeId) {
            this.setState({ storeId: this.props.storeId });
        }

        this.fillUnits();
        this.fillCurrencies();

        this.loadProducts();
    }

    componentWillReceiveProps(nextProps){
        if(this.props.match.params.q !== nextProps.match.params.q){
            this.setState({ query: nextProps.match.params.q });
            this.loadProducts();
        }
    }

    fillUnits() {
        // Make an object of unit abbreviations keyed to their IDs.
        axios.get(unitsApi).then((response) => {
            let unitsDimension = {},
                unitsWeight = {};

            for (let unit of response.data) {
                switch (unit.type.name) {
                    case 'dimension':
                        unitsDimension[unit.id] = unit.abbreviation;
                        break;
                    case 'weight':
                        unitsWeight[unit.id] = unit.abbreviation;
                        break;
                }
            }

            this.setState({ unitsDimension, unitsWeight });
        });
    }

    fillCurrencies() {
        // Make an object of currency abbreviations keyed to their IDs.
        axios.get(currenciesApi).then((response) => {
            let currencies = {};

            for (let currency of response.data) {
                currencies[currency.id] = currency.abbreviation;
            }

            this.setState({ currencies: currencies });
        });
    }

    handleAddToCart = (product) => {
        // dispatching an action to redux store
        this.props.dispatch(addToCart(product));
        this.setState(() => ({snackbarOpen: true, snackbarMessage: ADDED_TO_CART_SNACKBAR}))
    };

    handleSnackbarRequestClose = () => {
        this.setState({
            snackbarOpen: false,
        });
    };

    static removeItemFromCart = (productID, props) => {
        let productToRemove = {
            productID
        };
        props.dispatch(removeFromCart(productToRemove));
    };

    handleUndoAction = () => {
        if(this.state.snackbarMessage === ADDED_TO_CART_SNACKBAR){
            ProductInfo.removeItemFromCart(this.state.productID, this.props);
        }
        else{
            this.props.dispatch(removeFromWishlist(this.state.productID));
        }
        this.handleSnackbarRequestClose();
    };

    handleAddToWishlist = () => {
        const product = {
            productName: this.state.product.name,
            productImage: this.state.product.image,
            sellerName: this.state.product.sellerName,
            quantity: this.state.quantity,
            price: this.state.product.price,
            productID: this.state.productID,
            prevPrice: this.state.product.originalPrice
        };
        this.props.dispatch(addToWishlist(product));
        this.setState(() => ({snackbarOpen: true, snackbarMessage: ADDED_TO_WISHLIST_SNACKBAR}));
    };

    render(){

        if(this.state.isLoading){
            return (
                <Grid>
                    <Row className="margin-b-m">
                        <Col md={12} sm={12}>
                            <h3 className="text-center">fetching products...</h3>
                        </Col>
                    </Row>

                    <Row className="margin-b-m">
                        <Col md={12} sm={12}>
                            <LoadingScreen/>
                        </Col>
                    </Row>
                </Grid>
            )
        }

        else if(this.state.productsNotFound){
            return <InformationPanel
                    panelTitle={"There are no products currently available"}
                    informationHeading={"Something went wrong."}
                    message={"We were unable to find any products, which wasn't expected. Please try again later in the hopes it's been fixed."}
                    />
        }

        return (
            <Grid>
                <Row className="margin-b-m">
                    <Col md={12} sm={12}>
                        <h3 className="text-center">Choose from a selection of products listed below</h3>
                    </Col>
                </Row>

                <Row>
                    <Col md={12} sm={12}>
                        <ProductList
                            products={this.state.products}
                            currencies={this.state.currencies}
                            unitsDimension={this.state.unitsDimension}
                            unitsWeight={this.state.unitsWeight}
                            handleAddToCart={this.handleAddToCart}
                        />
                    </Col>
                </Row>

                <Snackbar
                    open={this.state.snackbarOpen}
                    message={this.state.snackbarMessage}
                    action="undo"
                    autoHideDuration={this.state.autoHideDuration}
                    onActionClick={this.handleUndoAction}
                    onRequestClose={this.handleSnackbarRequestClose}
                />
            </Grid>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        authentication: state.authentication
    };
};

export default connect(mapStateToProps)(Products);
