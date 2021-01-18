import React, { useEffect, useRef, useState } from 'react';
import Select, { components } from 'react-select';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { FontIcon, getTheme } from '@fluentui/react';
import SuggestionService from './SuggestionService';
import { Subscription } from 'rxjs';


const theme = getTheme();

const customStyles = {
    control: (styles: any, state: any) => {
        return ({
            ...styles,
            borderRadius: 2,
            borderColor: state.isFocused ? theme.palette.blueDark : theme.palette.neutralPrimary,
            minHeight: 32,
        });
    },
    valueContainer: (styles: any) => ({
        ...styles,
        paddingTop: 0,
    }),
    menu: (styles: any) => ({
        ...styles,
        marginTop: 0,
    }),
    menuList: (styles: any) => ({
        ...styles,
        padding: 0,
    }),
};

const getMultiValueLabel = (props, tokenFromField: string) => {
    const myProps = { ...props, children: props.data[tokenFromField] };
    return (
        <components.MultiValueLabel {...myProps} />
    );
};

var suggestSubscription: Subscription = null;

const TagPicker = (props) => {
    const { querySize, placeholder,
        tokenField, defaultOptions,
        loadOptions, fastQuery,
        suggestFields, onChange } = props;

    const [state, setState] = useState({
        selectedItem: [],
        loading: false
    });
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState([{}]);
    const [loading, setLoading] = useState(false);
    const [suggestionService, setSuggestionService] = useState<SuggestionService>(
        new SuggestionService(defaultOptions, querySize, suggestFields)
    );
    const selectElement = useRef(null);

    useEffect(() => {
        onChange(state.selectedItem);
        return () => {
        }
    }, [state.selectedItem]);

    const subscribeSuggestion = () => {
        suggestSubscription?.unsubscribe();
        suggestSubscription = suggestionService.onSuggestion().subscribe(setOptions)
    }


    useEffect(() => {
        if (suggestionService == null) return;
        suggestionService.setRemoteQuery(loadOptions, fastQuery);
        subscribeSuggestion();
        suggestionService.loading.subscribe(setLoading)
        return () => {

        }
    }, [suggestionService]);

    useEffect(() => {
        if (suggestionService == null) return;
        suggestionService.onQueryChange(inputValue);
        return () => {
        }
    }, [inputValue])


    const handleTapPressed = async (inputValue: string) => {
        selectElement.current.state.menuIsOpen = false;
        setState({
            ...state,
            selectedItem: await suggestionService.handleTapPressed(
                state.selectedItem,
                inputValue, querySize
            )
        });
        subscribeSuggestion();
    }

    return <Select
        options={options}
        isLoading={loading}
        ref={selectElement}
        styles={customStyles}
        placeholder={placeholder}
        components={{
            MultiValueLabel: props => getMultiValueLabel(props, tokenField),
            IndicatorSeparator: () => null,
            ClearIndicator: () => null,
            DropdownIndicator: () => (
                <FontIcon
                    iconName="ChevronDown"
                    style={{ paddingRight: "7px", fontSize: "12px" }}
                />
            ),
        }}
        filterOption={() => true}
        onKeyDown={event => {
            // on Tap pressed
            if (event.keyCode == 9) {
                const inputValue = event.target.value;
                if (inputValue.length == 0) {
                    return;
                }
                setInputValue("");
                event.preventDefault();
                handleTapPressed(inputValue);
            }
        }}
        inputValue={inputValue}
        onInputChange={inputValue => {
            setInputValue(inputValue);
        }}
        value={state.selectedItem}
        onChange={(v) => {
            setState({
                ...state,
                selectedItem: Array.isArray(v) ? v : []
            });
        }}
        theme={(theme) => ({
            ...theme,
            colors: {
                ...theme.colors,
                primary25: "#EDEBE9",
            },
        })}
        isMulti></Select>
}

TagPicker.defaultProps = {
    querySize: 0,
    placeholder: "Select ...",
    tokenField: "value",
    suggestFields: ["value", "label"]
}

TagPicker.propTypes = {
    defaultOptions: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
    })).isRequired,
    suggestFields: PropTypes.arrayOf(PropTypes.string),
    querySize: PropTypes.number,
    placeholder: PropTypes.string,
    onChange: PropTypes.func,
    loadOptions: PropTypes.func,
    fastQuery: PropTypes.func,
    tokenField: PropTypes.string
}


export default TagPicker;