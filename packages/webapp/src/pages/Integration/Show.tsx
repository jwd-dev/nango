import { useParams } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router';
import { useState, useEffect } from 'react';

import {
    useGetProjectInfoAPI,
    useGetIntegrationEndpointsAPI,
    useGetIntegrationDetailsAPI
} from '../../utils/api';
import { LeftNavBarItems } from '../../components/LeftNavBar';
import DashboardLayout from '../../layout/DashboardLayout';
import { defaultCallback } from '../../utils/utils';
import APIReference from './APIReference';
import Button from '../../components/ui/button/Button';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import IntegrationLogo from '../../components/ui/IntegrationLogo';
import Scripts from './Scripts';
import AuthSettings from './AuthSettings';
import { IntegrationConfig, Flow, Account } from '../../types';

export enum Tabs {
    API,
    Scripts,
    Auth
}

export interface FlowConfiguration {
    provider: string;
    providerConfigKey: string;
    syncs: Flow[];
    actions: Flow[];
    rawName?: string
}

export interface EndpointResponse {
    enabledFlows: FlowConfiguration | null;
    unEnabledFlows?: FlowConfiguration;
}

export default function ShowIntegration() {
    const [loaded, setLoaded] = useState(false);
    const [accountLoaded, setAccountLoaded] = useState(false);
    const [endpoints, setEndpoints] = useState<EndpointResponse>();
    const [integration, setIntegration] = useState<IntegrationConfig | null>(null);
    const { providerConfigKey } = useParams();
    const [activeTab, setActiveTab] = useState<Tabs>(Tabs.API);
    const [account, setAccount] = useState<Account>();
    const getIntegrationDetailsAPI = useGetIntegrationDetailsAPI();
    const getEndpoints = useGetIntegrationEndpointsAPI();
    const getProjectInfoAPI = useGetProjectInfoAPI()
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.hash === '#api') {
            setActiveTab(Tabs.API);
        }
        if (location.hash === '#scripts') {
            setActiveTab(Tabs.Scripts);
        }
        if (location.hash === '#auth') {
            setActiveTab(Tabs.Auth);
        }
    }, [location]);

    useEffect(() => {
        const getProviders = async () => {
            if (providerConfigKey) {
                let res = await getIntegrationDetailsAPI(providerConfigKey);
                if (res?.status === 200) {
                    const data = await res.json();
                    const loadedIntegration = data['config'];
                    setIntegration(data['config']);
                    const endpointsRes = await getEndpoints(loadedIntegration.unique_key, loadedIntegration.provider);
                    if (endpointsRes?.status === 200) {
                        const endpointData = await endpointsRes.json();
                        setEndpoints(endpointData);
                    }
                }
            }
        };

        if (!loaded) {
            setLoaded(true);
            getProviders();
        }
    }, [providerConfigKey, getIntegrationDetailsAPI, loaded, setLoaded, getEndpoints]);

    useEffect(() => {
        const getAccount = async () => {
            let res = await getProjectInfoAPI();

            if (res?.status === 200) {
                const account = (await res.json())['account'];
                setAccount({
                    ...account,
                    callback_url: account.callback_url || defaultCallback()
                });
            }
        };

        if (!accountLoaded) {
            setAccountLoaded(true);
            getAccount();
        }
    }, [accountLoaded, setAccountLoaded, getProjectInfoAPI, setAccount]);

    return (
        <DashboardLayout selectedItem={LeftNavBarItems.Integrations}>
            <div>
                {integration && (
                    <div className="mx-auto">
                        <div className="flex justify-between items-center">
                            <div className="flex">
                                <IntegrationLogo provider={integration?.provider} height={24} width={24} classNames="mr-2" />
                                <div className="mt-3 ml-6">
                                    <span className="text-left text-2xl font-semibold tracking-tight text-gray-400 mb-12">
                                        Integration
                                    </span>
                                    <h2 className="text-left text-3xl font-semibold tracking-tight text-white">
                                        {providerConfigKey}
                                    </h2>
                                </div>
                            </div>
                            <Button
                                variant="zinc"
                                size="sm"
                                className="flex cursor-pointer text-gray-400 neutral-700 items-center"
                                onClick={() => {
                                    navigate(`/connections/create/${providerConfigKey}`);
                                }}
                                >
                                <BuildingOfficeIcon className="flex h-5 w-5" />
                                <span className="px-1">Connect</span>
                            </Button>
                        </div>
                    </div>
                )}
                <section className="mt-20">
                    <ul className="flex text-gray-400 space-x-8 text-sm cursor-pointer">
                        <li className={`p-2 rounded ${activeTab === Tabs.API ? 'bg-zinc-900 text-white' : 'hover:bg-gray-700'}`} onClick={() => setActiveTab(Tabs.API)}>API Reference</li>
                        <li className={`p-2 rounded ${activeTab === Tabs.Scripts ? 'bg-zinc-900 text-white' : 'hover:bg-gray-700'}`} onClick={() => setActiveTab(Tabs.Scripts)}>Scripts</li>
                        <li className={`p-2 rounded ${activeTab === Tabs.Auth ? 'bg-zinc-900 text-white' : 'hover:bg-gray-700'}`} onClick={() => setActiveTab(Tabs.Auth)}>Settings</li>
                    </ul>
                </section>
                <section className="mt-10">
                    {activeTab === Tabs.API && integration && endpoints && account && (
                        <APIReference integration={integration} setActiveTab={setActiveTab} endpoints={endpoints} account={account} />
                    )}
                    {activeTab === Tabs.Scripts && integration && endpoints && (
                        <Scripts integration={integration} endpoints={endpoints} setLoaded={setLoaded} />
                    )}
                    {activeTab === Tabs.Auth && integration && account && (
                        <AuthSettings integration={integration} account={account} />
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
