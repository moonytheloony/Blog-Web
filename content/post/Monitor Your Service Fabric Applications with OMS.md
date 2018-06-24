+++
author = "Rahul Rai"
categories = ["azure", "service fabric"]
date = "2017-03-09T17:04:47+10:00"
draft = true
tags = ["service-fabric", "logging"]
title = "Monitor Your Service Fabric Applications with OMS"
type = "post"
+++

Azure Operations Management Suite (OMS) gives you a visual depiction of log data from your cloud and on-premise servers. You can corelate , combine, and analyze data from OMS console which gives you a complete picture of not just the state of application but also of the environemnt on which it is executing. To connect with OMS, you need to install an OMS agent, and write logs to a OMS known data store from where it can pick up the data.

OMS is capable of performing other tasks such as backup, automation, and site recovery. However, we will only discuss the logging feature of it in this article.

## Create OMS Workspace
You first need to create an OMS workspace to use OMS. You can visit the OMS dedicated website [http:// www.microsoft.com/OMS](http:// www.microsoft.com/OMS) to get started.

- Sign in the OMS portal and choose either the free trial or link your Azure subscription. Follow the steps the wizard takes you through to complete the setup. You might need to acknoeledge an email to provision the linkage between OMS and your Azure subscription.
- Once you are done with the setup. You can start the process of creating a new workspace by clicking on the **Create New Workspace** button. 

Start Creating New Workspace.png

- Fill up the form that you see on the next page. 

Create New OMS Workspace.png

- You might be asked to select an Azure subscriptiuon at this step if not previously. However, after linking the subscripotion, you would end up on the OMS dashboard. 

## Link Log Storage Account




{{< sourceCode src="https://github.com/rahulrai-in/phonebookonservicefabric" >}}



{{< subscribe >}}