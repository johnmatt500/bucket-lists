# Requirements Specification: v0.0.0
## Project Name: BucketLists

### 1. Introduction
The purpose of this application is to allow users to create and collaborate on bucket lists. Buckets can be shared among users so they can add items to the list and complete them together. This application is ideals for couples and groups of friends who are planning a vacation, going to college/school together, moving away from their old home, or moving to somewhere new.

### 2. User Personas
In the first version of this application, a single user type will exist. Users can sign up for an account via email and password. In a future iteration of this application, they will be able to use a third-party integration to create an account. Users in this application can create buckets, and once they're a member of a bucket they can create, edit, and complete items within buckets. 

### 3. Sample Workflow
1. A user creates a new bucket list by specify a name, location, and bucket end date. Then, the user can optionally invite one or more users to their bucket specifying their email address.
2. Once the bucket has been created and users have been added to it, any member of the bucket can add items to the bucket list. Each item shall consist of a name, an optional address, an importance level (1-5), and a duration that it would take to complete the task (both a number and a scale: hours or days).
3. If a bucket has one user, the item is automatically added to the bucket when it's submitted. If the bucket has multiple users, all the other users will vote on the item to determine whether it gets added to the bucket. If more than 50% approve of the item, it will be added to the bucket. Otherwise, the item will be rejected.
4. Once an item has been added to a bucket, any member of the bucket can mark an item as completed. As items within the bucket are completed, the bucket's completion percentage increases. 
5. Once all the items in a bucket are completed, or the bucket's end date expires, each member of the bucket will have the option to restart the bucket. Performing this action will automatically fill the new bucket with each incomplete item in the original bucket.

### 4. Tech Stack
- **Database:** PostgreSQL will be used to save all relevant application data. Supabase will likely be used in the future to host the database.
- **UI:** TBD; considering TypeScript and React, but open to other ideas.
- **Backend:** Node.js
- **Hosting** The original build of this application will be hosted by Vercel.

### 5. Data Types
**Note**: these data definitions are not deterministic. I am open to adding new data types and new properties to each data type.
1. User:
* id: varchar
* name: varchar
* email: varchar
* created_date: date
* last_login_date: date

2. Bucket
* guid: varchar
* name: varchar
* location: varchar
* created_date: date
* created_by: varchar
* expiration_date: date
* is_completed: boolean
* completion_date: date

3. Item
* guid: varchar
* bucket_id: varchar
* name: varchar
* full_address: varchar
* address_line_1: varchar
* address_line_2: varchar
* city: varchar
* state_province: varchar
* postal_code: varchar
* country_code: char
* latitude: decimal
* longitude: decimal
* importance: integer
* amount_time_required: integer
* time_scale: varchar
* total_hours_required: integer
* weight: decimal
* is_completed: boolean
* completion_date: date
* completed_by: varchar
* created_date: date
* created_by: varchar
* status: varchar

4. BucketMember
* bucket_id: varchar
* user_id: varchar
* created_on: date

5. ItemVote
* item_id: varchar
* user_id: varchar
* vote: varchar
* cast_date: date

6. BucketInvitation
* guid: varchar
* email_address: varchar
* user_id: varchar
* bucket_id: varchar
* created_date: date
* created_by: varchar

### 6. User Interfaces (UI)
- Splash page with brief application description and a log in/sign up link.
- Once logged in, users should see a page containing the buckets they are a part of (shown as tiles in a grid), along with a button that allows them to create a new bucket.
- The primary content driving the UI for a bucket should be a graphic that shows the bucket filled with water based on the bucket's completion_percentage. A list of items should also be displayed alongside the bucket, and a button should be presented that allows the user to create a new item for the bucket. Items that have not yet been added to the bucket should be put in a separate "pending" section, and the user should be able to vote to accept or reject the item if they haven't already voted on it.
- The "Create Bucket" and "Create Item" screens should contain responsive, minimalistic
- All UI should be responsive on mobile and desktop browsers.
- Overall, the UI should be friendly and clean.
- Preferred primary colors to use in the UI: #85B7D6 and #0B5471.
- Preferred secondary colors to use in the UI: #F6F0E7 and #797C82.