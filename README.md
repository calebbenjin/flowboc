# Flow Yoga Bookings

Flowbuk – MVP Scope 

Yoga Booking SaaS

1. Product Overview

A lightweight booking and business-management SaaS for independent yoga instructors and small wellness businesses.

The platform enables instructors to create and publish classes, accept bookings and payments, manage students, and automate essential communication from one simple dashboard.

Core Value Proposition

Create your class. Share your booking link. Get paid.

The product should feel significantly simpler than traditional studio-management platforms.

2. MVP Goal

The MVP should validate whether independent yoga instructors are willing to use and pay for a simple platform that replaces their current combination of:

WhatsApp

Instagram DMs

Google Forms

Spreadsheets

Bank transfers

Manual reminders

Generic booking tools

Primary success criteria

A teacher should be able to:

Create an account.

Set up their instructor profile.

Create a class in under 5 minutes.

Get a public booking URL.

Share the URL with students.

Receive a student booking.

Receive payment.

See the booking in their dashboard.

Have the student automatically receive confirmation.

Manage attendance after the class.

3. Target Users

Primary User — Independent Yoga Instructor

An instructor who runs their own classes independently and manages anywhere from a handful to hundreds of students.

Typical characteristics:

Runs recurring or one-off classes.

Promotes classes through Instagram, WhatsApp, or their website.

Handles bookings manually or with fragmented tools.

Collects payments manually or through payment links.

Wants to spend less time managing administration.

Does not need complex studio-management software.

Secondary User — Student

A person who wants to discover, book, and pay for a yoga class.

Students should not need to create an account before making their first booking.

4. MVP Feature Scope

A. Authentication & Instructor Onboarding

Features

Instructor sign up

Email/password authentication

Login/logout

Password reset

Basic profile setup

Instructor profile

Name

Profile photo

Bio

Location

Contact information

Social links

Yoga specialties

Booking page slug

Example:

app.com/caleb-yoga

Onboarding goal

After signup, the instructor should be guided toward creating their first class.

The onboarding should end with:

Your booking page is ready. Create your first class.

5. Class Management

This is the core teacher feature.

Create a class

The instructor can define:

Class name

Class cover photo

Description

Class type

Date

Start time

Duration

Location

Online/in-person

Price

Maximum capacity

Booking deadline

Cancellation policy

Recurring classes

Allow instructors to create recurring schedules.

Example:

Morning Flow
Every Tuesday & Thursday
7:00 AM
60 minutes
₦8,000
15 spots

The instructor should be able to edit:

One occurrence

Future occurrences

Entire recurring series

Class status

Classes can have:

Draft

Published

Full

Cancelled

Completed

6. Public Booking Page

Every instructor receives a shareable public page.

Example:

app.com/caleb-yoga

Page contains

Instructor profile

Bio

Location

Upcoming classes

Class details

Price

Available spots

Book button

Example:

Caleb Yoga

Yoga instructor helping people build strength, flexibility, and mindfulness.

Upcoming Classes

Morning Flow
Tuesday · 7:00 AM
60 minutes
8 spots available
₦8,000

[Book Class]

Important MVP decision

Students should not need an account to book.

They provide their details during checkout.

This minimizes booking friction.

7. Student Booking

Booking flow

Public Instructor Page

        ↓

Select Class

        ↓

Class Details

        ↓

Enter Information

        ↓

Payment

        ↓

Booking Confirmation

Student information

Full name

Email

Phone number

Optional:

Emergency contact

Notes

Booking validation

The system should verify:

Class is still available

Capacity has not been reached

Booking deadline has not passed

Student has not already booked the same class

8. Payments

The MVP should support online payments.

Payment flow

Select Class

     ↓

Enter Details

     ↓

Payment

     ↓

Payment Successful

     ↓

Booking Confirmed

Payment states

Pending

Successful

Failed

Refunded

Cancelled

Teacher dashboard

Teachers should be able to see:

Total revenue

Paid bookings

Outstanding/failed payments

Revenue per class

The payment provider can initially be abstracted behind a payment service so additional providers can be added later.

9. Booking Management

Teachers need a simple view of every class.

Example:

Morning Flow

Tuesday · 7:00 AM

8 / 12 booked

Student

Status

Payment

Sarah

Confirmed

Paid

John

Confirmed

Paid

Mary

Confirmed

Paid

Teacher actions

View student

Cancel booking

Refund booking

Manually add student

Mark attendance

Manual booking is important because some instructors will still accept bookings through WhatsApp or in person.

10. Attendance

Keep this extremely simple.

For each class:

Morning Flow

Tuesday · 7:00 AM

☑ Sarah

☑ John

☐ Mary

☑ David

8 booked

7 attended

1 absent

No advanced attendance analytics in MVP.

The primary purpose is to allow teachers to know who actually attended.

11. Student Management

The platform automatically builds a student database from bookings.

Student profile

Name

Email

Phone

Classes booked

Classes attended

Total spent

Last booking

Upcoming booking

Teacher view

Students

Sarah Johnson

12 classes

₦96,000 spent

John Smith

8 classes

₦64,000 spent

This turns the booking system into the beginning of a lightweight CRM.

12. Notifications

The MVP should automate essential communication.

Student receives

Booking confirmation

You're booked for Morning Flow with Caleb.

Payment confirmation

Your payment of ₦8,000 was successful.

Class reminder

Your Morning Flow class starts tomorrow at 7:00 AM.

Cancellation notification

Your class has been cancelled.

Teacher receives

New booking

Payment received

Cancellation

Class capacity reached

Email should be sufficient for the initial MVP.

WhatsApp can become a major differentiator later.

13. Calendar Integration

After booking, the student can add the class to their calendar.

MVP can provide:

Google Calendar

Downloadable .ics calendar event

No need to build a full calendar system.

14. Basic Dashboard

The teacher dashboard should answer four questions immediately:

What do I have coming up?

Upcoming classes.

Who is attending?

Recent bookings.

How much have I made?

Revenue.

What needs my attention?

Examples:

Class almost full

Failed payment

Upcoming class

Pending action

Example

Good morning, Caleb 👋

Revenue this month

₦184,000

Upcoming classes

4

Bookings

37

Students

28

UPCOMING

Morning Flow

Today · 7:00 AM

8 / 12 booked

[View Class]

RECENT BOOKINGS

Sarah Johnson

Morning Flow

Paid · ₦8,000

15. Class Passes / Packages

This should be included only if validation shows instructors need it early.

Example

5-Class Pass

₦35,000

Student purchases the package and receives:

5 classes remaining

When the student books:

1 class deducted

4 classes remaining

This creates a path toward recurring revenue and retention.

However, if keeping the MVP extremely lean, class passes can be Phase 2.

16. Subscription Plans

The SaaS itself can eventually have:

Free

Basic instructor profile

Limited classes (Only allow to create only free class and 1 paid class)

Non-recurring class

Booking page

Basic bookings

Pro

Unlimited classes

Payments

Recurring classes

Automated reminders

Student management

Class passes

Revenue analytics

Studio

Multiple instructors

Multiple locations

Staff management

Memberships

Advanced analytics

MVP recommendation: Start with a free trial rather than implementing complicated subscription logic immediately.

17. What Is NOT in the MVP

To avoid turning this into another Mindbody, deliberately exclude:

Student marketplace

Native mobile apps

AI features

Advanced analytics

Membership management

Multiple instructors

Multiple locations

Staff permissions

Advanced marketing automation

Loyalty programs

Reviews/ratings

Community/social feed

Video classes

On-demand content

Complex accounting

Payroll

Inventory

Advanced CRM

WhatsApp automation

These can be evaluated after real usage.

18. MVP Core Product Loop

The entire MVP revolves around this:

            TEACHER

                │

                ▼

          Create Account

                │

                ▼

          Create Profile

                │

                ▼

           Create Class

                │

                ▼

        Publish Booking Page

                │

                ▼

          Share Booking Link

                │

                ▼

              STUDENT

                │

                ▼

          View Class

                │

                ▼

             Book

                │

                ▼

             Pay

                │

                ▼

        Booking Confirmed

                │

                ▼

          Attend Class

                │

                ▼

             TEACHER

                │

                ▼

        Mark Attendance

                │

                ▼

        Student Relationship
