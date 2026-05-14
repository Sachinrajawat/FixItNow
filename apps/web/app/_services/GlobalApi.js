import { gql, request } from "graphql-request";

const PROJECT_ID = process.env.NEXT_PUBLIC_MASTER_URL_KEY;

if (!PROJECT_ID && typeof window !== "undefined") {
  // Soft warning in the browser only (don't crash SSR build).
  console.warn(
    "[GlobalApi] NEXT_PUBLIC_MASTER_URL_KEY is not set. Hygraph requests will fail."
  );
}

const MASTER_URL = `https://api-ap-south-1.hygraph.com/v2/${PROJECT_ID}/master`;

/**
 * Thin wrapper that gives us a single place to add auth headers, telemetry,
 * retries, etc. in the future.
 */
async function gqlRequest(query, variables = {}) {
  try {
    return await request(MASTER_URL, query, variables);
  } catch (error) {
    console.error("[GlobalApi] GraphQL request failed", {
      message: error?.message,
    });
    throw error;
  }
}

const CATEGORIES_QUERY = gql`
  query Categories {
    categories {
      id
      name
      bgcolor {
        hex
      }
      icon {
        url
      }
    }
  }
`;

const ALL_BUSINESSES_QUERY = gql`
  query BusinessList {
    businessLists {
      id
      name
      about
      address
      contactPerson
      email
      images {
        url
      }
      category {
        name
      }
    }
  }
`;

const BUSINESS_BY_CATEGORY_QUERY = gql`
  query BusinessByCategory($category: String!) {
    businessLists(where: { category: { name: $category } }) {
      id
      name
      about
      address
      contactPerson
      email
      images {
        url
      }
      category {
        name
      }
    }
  }
`;

const BUSINESS_BY_ID_QUERY = gql`
  query BusinessById($id: ID!) {
    businessList(where: { id: $id }) {
      id
      name
      about
      address
      contactPerson
      email
      images {
        url
      }
      category {
        name
      }
    }
  }
`;

const CREATE_BOOKING_MUTATION = gql`
  mutation CreateBooking(
    $businessId: ID!
    $date: String!
    $time: String!
    $userEmail: String!
    $userName: String!
  ) {
    createBooking(
      data: {
        bookingStatus: booked
        businessList: { connect: { id: $businessId } }
        date: $date
        time: $time
        userEmail: $userEmail
        userName: $userName
      }
    ) {
      id
      date
      time
      userName
      userEmail
    }
    publishManyBookings(to: PUBLISHED) {
      count
    }
  }
`;

const BUSINESS_BOOKED_SLOTS_QUERY = gql`
  query BusinessBookedSlots($businessId: ID!, $date: String!) {
    bookings(where: { businessList_some: { id: $businessId }, date: $date }) {
      date
      time
    }
  }
`;

const USER_BOOKING_HISTORY_QUERY = gql`
  query UserBookingHistory($userEmail: String!) {
    bookings(where: { userEmail: $userEmail }, orderBy: publishedAt_DESC) {
      id
      date
      time
      businessList {
        name
        contactPerson
        address
        images {
          url
        }
      }
    }
  }
`;

const getCategory = () => gqlRequest(CATEGORIES_QUERY);

const getAllBusinessDetails = () => gqlRequest(ALL_BUSINESSES_QUERY);

const getBusinessByCategory = (category) =>
  gqlRequest(BUSINESS_BY_CATEGORY_QUERY, { category });

const getBusinessById = (id) => gqlRequest(BUSINESS_BY_ID_QUERY, { id });

const createNewBooking = (businessId, date, time, userEmail, userName) =>
  gqlRequest(CREATE_BOOKING_MUTATION, {
    businessId,
    date,
    time,
    userEmail,
    userName,
  });

const BusinessBookedSlot = (businessId, date) =>
  gqlRequest(BUSINESS_BOOKED_SLOTS_QUERY, { businessId, date });

const GetUserBookingHistory = (userEmail) =>
  gqlRequest(USER_BOOKING_HISTORY_QUERY, { userEmail });

const GlobalApi = {
  getCategory,
  getAllBusinessDetails,
  getBusinessByCategory,
  getBusinessById,
  createNewBooking,
  BusinessBookedSlot,
  GetUserBookingHistory,
};

export default GlobalApi;
