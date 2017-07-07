+++
author = "Rahul Rai"
categories = ["azure", "bot-framework"]
date = "2017-05-19T17:04:47+10:00"
draft = true
tags = ["bot", "azure", "learning"]
title = "Building Bots with The Microsoft Bot Framework - Part 3"
type = "post"
+++
{{% notice %}}
In this series

1. [Introduction](/post/Building-Bots-with-The-Microsoft-Bot-Framework---Part-1/)
2. [Adding Dialogs and State to your bot](/post/Building-Bots-with-The-Microsoft-Bot-Framework---Part-2/)
{{% /notice %}}

Welcome to the third post in my blog series on Building Bots with The Microsoft Bot Framework. In the last post we saw how we can use Dialogs and State to carry out a meaningful conversation with the user. However, we also saw that interacting with the user using Dialogs involves a lot of complexity. Today we will discuss how we can reduce complexity of Bot development using a feature called Form Flow.

## What is Form Flow?
To understand the complexities of communication, recall your last interaction with a human customer service personnel. To assist you with your issues, the agent asks you a series of questions as though they are filling out a form. For example a typical conversation with a telco customer service executive may pan out as follows:

Executive: What is your phone number?
Customer: 123456789
Executive: What is the issue?
Customer: Frequent call drops.
Executive: At what time and date can our network team representative call you back?
Cutomer: Tomorrow at 9.

A simple conversation such as the one above  might involve complex scenarios. For example the customer might give out a wrong phone number and wants to change it later. In another scenario, the customer might present dates and times in different formats.

The Form Flow framework makes it easy for you to capture required information without caring about the other complex scenarios involved in bot communication. For example, navigating between steps, understanding numerical and textual enteries, and validating values etc. are automatically taken care of by the Form Flow. Using Form Flow you can bind user supplied information to object model which can be saved to the database and used later on.

## Building Forms Using Form Flow
You don't need to start creating Forms for your bot from scratch every single time. Microsoft Bot Framework gives you three options to jumpstart building Forms each more flexible than the prebious one. The Form Flow extensions are: 

1. **Attributes**: Attributes are decorators on your model properties and classes that help people interact with your bot in a much better manner. For example, your model might have a boolean property in your model called *isPrintRequired* which you want to present to the user with a message *Would you like a printed copy?*. Attributes let you control such display messages.
2. **Custom Business Logic**: This option gives you control over how model properties need to be stored and retrieved. You can hook your own custom logic to carry out data persistence operations and setting values of the model as desired.
3. **The Form Builder Class**: You can use this option, if you desire the highest level of control on your Form Flows.

Let's discuss each of these options in a little bit more detail.

## Attributes
There are seven attributes supported by the Bot Fx.They are:

1. Prompt: The prompt issued by the bot to ask the user to input value for a field. You can decorate your model property with the `Prompt` attribute to define the message that should be sent to user asking for his input. For example `[Prompt("Would you like a printed copy?")]`.
2. Describe: This attribute lets you give an alias to your model properties. For example, you may want to refer to your property *isPrintRequired* as *printed copy* in your prompt message. In this case, you need to add a `Describe` attrivure `[Describe("printed copy")]` and  add a propmt `[Prompt("Would you like a {&}?")]` to yield *Would you like a printed copy?*.
3. Numeric: This attribute allows you to put a numeric limit on a property. For example `[Numeric(1,3)]` allows entering values only within the range by the user.
4.  Optional: This attriubte allows the user to not provide an input for a property. You can decorate your property with `[Optional]` to make it optional.
5. Pattern: This attribute allows you to specify a RegEx to validate the input. You can decorate your property with `[Pattern("REGEX")]` to validate user input against the expression.
6. Template: This attribute helps generate prompts or add values in prompts. For example, if you want to customize the message presented to the user to enable him to make a choice out of a given set of options, you can override the `EnumSelectOne` template (the default template used by Bot Fx) using this attribute as: `[Template(TemplateUsage.EnumSelectOne, "Please select a value for {&}", ChoiceStyle=ChoiceStyleOptions.PerLine)]`. Just like `EnumSelectOne` template, there are several templates that you can override. [Here is a list](http://bit.ly/2rX0YiR) of all the templates that you can use.
7. Terms: This attribute lets you define alternate text for an input. For example, for a volume field, you may want to enable user to enter l, litre, ltr. etc. each of which should select the Litre option. You can apply a `Terms` attribute to allow the user to do that e.g.
~~~CS
public enum Volume
{
	[Terms("l", "litre", "ltr.")]
	Litre,
	Gallon
}
~~~

## Custom Business Logic
You can inject custom logic that gets triggered before setting the value of or getting a value from a model property. This helps you add custom validateions before setting the value or perform customizations before presenting the property value to the user. It is more flexible than Attributes and gives you a higher degree of control. Therefore, injecting custom business logic should be used only if you have exhausted all possibilities with the Attributes.

## Form Builder Class
The Form Builder class givess you the ultimte control over your bot and its interactions. It is a Fluent API interface and therefore, it is easy to understand and consume. Using the Form Builkder, you can specify custom attributes and add custom logic which igves you the ultimate control over oyur bot.

## Puttng The Learning To Use
Let's extend our Blog Bot to 

{{< subscribe >}}